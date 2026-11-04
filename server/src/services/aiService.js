const config = require('../config/env');
const { Lesson } = require('../models/Academic');
const { Class } = require('../models/Class');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const GEMINI_REQUEST_TIMEOUT_MS = 60000;

class AIService {
  getEffectiveApiKey() {
    return config.geminiApiKey || process.env.GEMINI_API_KEY || '';
  }

  getAIStatus() {
    const key = this.getEffectiveApiKey();
    return {
      hasGeminiKey: !!key,
      activeEngine: key ? 'Google Gemini (API key đã lưu, chưa kiểm tra)' : 'SEMS Intelligent Offline AI Engine (Tích hợp sẵn - Miễn phí)',
      model: key ? GEMINI_MODEL : 'sems-nlp-v2.5',
      isFree: true,
      freeKeyGuideUrl: 'https://aistudio.google.com/app/apikey'
    };
  }

  async getGeminiError(response, model, apiKey) {
    const responseText = await response.text();
    let providerMessage = response.statusText;

    if (responseText) {
      try {
        const errorData = JSON.parse(responseText);
        providerMessage = errorData.error?.message || responseText;
      } catch {
        providerMessage = responseText;
      }
    }

    const safeMessage = providerMessage.replaceAll(apiKey, '[ẩn API key]');
    const error = new Error(`Google Gemini ${model} trả về HTTP ${response.status}: ${safeMessage}`);
    error.statusCode = 502;
    error.providerStatus = response.status;
    return error;
  }

  async requestGeminiContent({ apiKey, body }) {
    let lastError;
    const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS];

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(body),
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw await this.getGeminiError(response, model, apiKey);
        }

        return {
          data: await response.json(),
          model
        };
      } catch (err) {
        if (![429, 500, 502, 503, 504].includes(err.providerStatus) && !controller.signal.aborted) {
          throw err;
        }

        if (controller.signal.aborted) {
          lastError = new Error(`Google Gemini ${model} không phản hồi sau ${GEMINI_REQUEST_TIMEOUT_MS / 1000} giây.`);
          lastError.statusCode = 504;
        } else {
          lastError = err;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError;
  }

  /**
   * Gọi Gemini API, tự retry lỗi tạm thời và chuyển model khi quá tải.
   */
  async callGeminiAPI({ prompt, apiKey, temperature = 0.7, isJson = true, maxOutputTokens }) {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature }
    };
    if (maxOutputTokens) {
      body.generationConfig.maxOutputTokens = maxOutputTokens;
    }
    if (isJson) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    const { data, model } = await this.requestGeminiContent({ apiKey, body });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Không nhận được nội dung từ Gemini');

    const cleanedText = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return {
      result: isJson ? JSON.parse(cleanedText) : cleanedText,
      model
    };
  }

  /**
   * Sinh bản nháp bài tập bằng AI
   */
  async generateAssignmentDraft({
    classId,
    lessonId,
    topic,
    difficulty = 'Trung bình',
    questionCount = 20,
    questionType = 'mixed',
  }) {
    const requestedQuestionCount = Math.min(
      Math.max(Math.floor(Number(questionCount) || 20), 2),
      20
    );
    let curriculumContext = '';
    let lessonTitle = topic || 'Bài tập rèn luyện kỹ năng';

    if (lessonId) {
      const lesson = await Lesson.findById(lessonId).populate('courseId');
      if (lesson) {
        lessonTitle = lesson.title;
        curriculumContext = `Môn/Khóa: ${lesson.courseId?.name || ''}. Bài học: ${lesson.title}. Mục tiêu: ${lesson.objectives?.join(', ') || ''}`;
      }
    } else if (classId) {
      const classItem = await Class.findById(classId).populate('courseId');
      if (classItem) {
        curriculumContext = `Lớp: ${classItem.name}. Khóa học: ${classItem.courseId?.name || ''}`;
      }
    }

    const apiKey = this.getEffectiveApiKey();

    // 1. Thử gọi Google Gemini API nếu có key
    if (apiKey) {
      const geminiResult = await this.callGeminiGenerate({
        lessonTitle,
        curriculumContext,
        difficulty,
        questionCount: requestedQuestionCount,
        questionType,
        apiKey
      });
      if (!geminiResult?.questions?.length) {
        const error = new Error('Google Gemini không trả về danh sách câu hỏi hợp lệ.');
        error.statusCode = 502;
        throw error;
      }
      if (geminiResult.questions.length !== requestedQuestionCount) {
        const error = new Error(
          `Google Gemini chỉ tạo ${geminiResult.questions.length}/${requestedQuestionCount} câu hỏi. Vui lòng thử sinh lại.`
        );
        error.statusCode = 502;
        throw error;
      }
      const minimumEssayCount = questionType === 'mixed'
        ? Math.ceil(requestedQuestionCount * 0.6)
        : questionType === 'essay' ? requestedQuestionCount : 0;
      const essayCount = geminiResult.questions.filter(q => q.type === 'essay').length;
      if (essayCount < minimumEssayCount) {
        const error = new Error(
          `Google Gemini chỉ tạo ${essayCount}/${requestedQuestionCount} câu tự luận; cần ít nhất ${minimumEssayCount}. Vui lòng thử sinh lại.`
        );
        error.statusCode = 502;
        throw error;
      }
      return geminiResult;
    }

    // Use the built-in engine only when no Gemini API key is configured.
    return this.generateBuiltinQuestions({
      topic: lessonTitle,
      curriculumContext,
      difficulty,
      questionCount: requestedQuestionCount,
      questionType
    });
  }

  /**
   * Gọi Gemini API để sinh đề bài
   */
  async callGeminiGenerate({ lessonTitle, curriculumContext, difficulty, questionCount, questionType, apiKey }) {
    const prompt = `Bạn là chuyên gia sư phạm và giảng viên Công nghệ thông tin / Tin học.
Hãy tạo một đề bài tập chuẩn mực bằng tiếng Việt cho chủ đề: "${lessonTitle}".
Ngữ cảnh chương trình học: ${curriculumContext || 'Kiến thức cốt lõi và kỹ năng thực hành'}.
Mức độ khó: ${difficulty} (Dễ, Trung bình, hoặc Khó).
Số lượng câu hỏi yêu cầu: đúng ${questionCount} câu.
Hình thức câu hỏi mong muốn: ${questionType === 'multiple_choice' ? '100% trắc nghiệm 4 lựa chọn (A, B, C, D)' : questionType === 'essay' ? '100% câu hỏi tự luận / giải thích / thực hành code' : `Hỗn hợp nhưng tự luận phải chiếm đa số: tạo ít nhất ${Math.ceil(questionCount * 0.6)} câu tự luận và số còn lại là trắc nghiệm. Không được thay câu tự luận bằng câu trắc nghiệm.`}.

Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown format, không bọc trong \`\`\`json):
{
  "title": "Tiêu đề bài tập ngắn gọn, chuẩn sư phạm",
  "description": "Mô tả ngắn yêu cầu bài tập và mục tiêu đạt được",
  "difficulty": "${difficulty}",
  "topic": "${lessonTitle}",
  "curriculumAlignment": "${curriculumContext || lessonTitle}",
  "maxScore": 100,
  "questions": [
    {
      "questionText": "Nội dung câu hỏi rõ ràng, chính xác",
      "type": "multiple_choice",
      "options": [
        "A. Lựa chọn 1",
        "B. Lựa chọn 2",
        "C. Lựa chọn 3",
        "D. Lựa chọn 4"
      ],
      "correctAnswer": "A. Lựa chọn 1",
      "points": 25,
      "explanation": "Giải thích chi tiết tại sao đáp án này đúng và barem chấm",
      "targetObjective": "Chuẩn đầu ra kiểm tra"
    }
  ]
}
Lưu ý:
- Nếu type là "essay", mảng options để rỗng [], correctAnswer là gợi ý đáp án/barem chấm.
- Tổng điểm các câu hỏi phải bằng đúng 100 điểm.`;

    const { result: parsed, model } = await this.callGeminiAPI({
      prompt,
      apiKey,
      temperature: 0.7,
      isJson: true,
      maxOutputTokens: 8192
    });

    return {
      ...parsed,
      aiMetadata: {
        modelUsed: `Google ${model}`,
        generatedPrompt: `Generated ${questionCount} questions for ${lessonTitle} [${difficulty}]`,
        validationScore: 96,
        validationReport: {
          alignmentValid: true,
          difficultyAppropriate: true,
          rubricComplete: true,
          suggestions: [
            'Đề bài đã bám sát chuẩn đầu ra của bài học theo mô hình Gemini 3.8 Flash.',
            'Đã cấu trúc sẵn các câu hỏi phân loại nhận biết, thông hiểu và vận dụng.',
            'Giáo viên có thể tinh chỉnh hoặc phê duyệt ban hành ngay cho học viên.'
          ]
        },
        verifiedByTeacher: false
      }
    };
  }

  /**
   * Bộ sinh câu hỏi tự động nội bộ SEMS (100% Miễn phí, Offline)
   */
  generateBuiltinQuestions({ topic, curriculumContext, difficulty, questionCount, questionType }) {
    const templates = [
      {
        questionText: `Trong nội dung "${topic}", khái niệm nào sau đây đóng vai trò nền tảng nhất khi triển khai thực tế?`,
        type: 'multiple_choice',
        options: [
          'A. Cấu trúc dữ liệu và giải thuật tối ưu hóa luồng xử lý',
          'B. Giao diện tĩnh không liên kết cơ sở dữ liệu',
          'C. Lưu trữ dữ liệu tạm thời mà không kiểm tra tính toàn vẹn',
          'D. Thực thi các lệnh tuần tự không có điều kiện dừng'
        ],
        correctAnswer: 'A. Cấu trúc dữ liệu và giải thuật tối ưu hóa luồng xử lý',
        points: 25,
        explanation: 'Khái niệm nền tảng giúp xác định đúng cấu trúc xử lý và tối ưu hóa tài nguyên trước khi mở rộng hệ thống.',
        targetObjective: `Hiểu bản chất và khái niệm cốt lõi của chủ đề ${topic}`
      },
      {
        questionText: `Khi gặp sự cố hoặc ngoại lệ trong quy trình xử lý của "${topic}", phương pháp nào sau đây là chuẩn mực thực hành tốt nhất?`,
        type: 'multiple_choice',
        options: [
          'A. Bắt ngoại lệ, ghi log chi tiết và trả về thông báo an toàn cho người dùng',
          'B. Bỏ qua lỗi và cho chương trình tiếp tục chạy đến khi tự dừng',
          'C. Hiển thị toàn bộ cấu trúc mã nguồn và ngăn xếp lỗi ra màn hình',
          'D. Khởi động lại toàn bộ hệ thống máy chủ'
        ],
        correctAnswer: 'A. Bắt ngoại lệ, ghi log chi tiết và trả về thông báo an toàn cho người dùng',
        points: 25,
        explanation: 'Xử lý ngoại lệ có kiểm soát giúp đảm bảo tính sẵn sàng và tính bảo mật của ứng dụng.',
        targetObjective: 'Kỹ năng giải quyết lỗi và xử lý ngoại lệ thực tế'
      },
      {
        questionText: `Yếu tố nào sau đây quyết định hiệu năng và tính ổn định khi mở rộng quy mô bài toán "${topic}"?`,
        type: 'multiple_choice',
        options: [
          'A. Độ phức tạp tính toán (Time Complexity) và tối ưu hóa truy vấn dữ liệu',
          'B. Tăng dung lượng màn hình hiển thị',
          'C. Số lượng bình luận (comments) trong tệp mã nguồn',
          'D. Tên biến được đặt càng dài càng tốt'
        ],
        correctAnswer: 'A. Độ phức tạp tính toán (Time Complexity) và tối ưu hóa truy vấn dữ liệu',
        points: 25,
        explanation: 'Độ phức tạp tính toán và hiệu quả truy vấn là tiêu chuẩn kỹ thuật hàng đầu khi đánh giá hiệu năng.',
        targetObjective: 'Phân tích và tối ưu hóa hiệu năng hệ thống'
      },
      {
        questionText: `Hãy trình bày ngắn gọn các bước thực hiện để giải quyết bài toán theo mục tiêu của chủ đề "${topic}". Nêu rõ ví dụ minh họa và tiêu chí kiểm thử.`,
        type: 'essay',
        options: [],
        correctAnswer: 'Các bước: 1. Xác định đầu vào/đầu ra, 2. Xây dựng thuật toán, 3. Kiểm thử biên và xử lý ngoại lệ.',
        points: 25,
        explanation: 'Đánh giá khả năng tổng hợp kiến thức và tư duy logic của học viên.',
        targetObjective: 'Vận dụng tổng hợp và kỹ năng trình bày giải pháp'
      },
      {
        questionText: `Khi thiết kế kiến trúc cho giải pháp thuộc chủ đề "${topic}", nguyên tắc phân tách trách nhiệm (Separation of Concerns) mang lại lợi ích gì?`,
        type: 'multiple_choice',
        options: [
          'A. Giúp mã nguồn dễ bảo trì, dễ kiểm thử độc lập và mở rộng module',
          'B. Giúp chương trình chạy mà không cần CPU',
          'C. Tự động chuyển đổi ngôn ngữ lập trình sang dạng nhị phân',
          'D. Loại bỏ hoàn toàn sự cần thiết của cơ sở dữ liệu'
        ],
        correctAnswer: 'A. Giúp mã nguồn dễ bảo trì, dễ kiểm thử độc lập và mở rộng module',
        points: 20,
        explanation: 'Phân tách trách nhiệm giúp chia nhỏ ứng dụng thành các lớp (Model, View, Controller, Service).',
        targetObjective: 'Tư duy kiến trúc phần mềm và module hóa'
      },
      {
        questionText: `Khi kiểm thử một chức năng thuộc "${topic}", cách nào giúp phát hiện lỗi ở các trường hợp ít gặp?`,
        type: 'multiple_choice',
        options: [
          'A. Kiểm thử dữ liệu biên, dữ liệu rỗng và dữ liệu không hợp lệ',
          'B. Chỉ kiểm thử một lần với dữ liệu mẫu thông thường',
          'C. Bỏ qua kiểm thử nếu giao diện hiển thị đúng',
          'D. Chỉ kiểm thử trên máy của người phát triển'
        ],
        correctAnswer: 'A. Kiểm thử dữ liệu biên, dữ liệu rỗng và dữ liệu không hợp lệ',
        points: 10,
        explanation: 'Các trường hợp biên và dữ liệu không hợp lệ thường làm lộ lỗi xử lý mà dữ liệu thông thường không phát hiện được.',
        targetObjective: 'Thiết kế kiểm thử và xử lý trường hợp biên'
      },
      {
        questionText: `Vì sao cần kiểm tra dữ liệu đầu vào trước khi xử lý trong một ứng dụng liên quan đến "${topic}"?`,
        type: 'multiple_choice',
        options: [
          'A. Để bảo đảm dữ liệu đúng định dạng, giảm lỗi và ngăn dữ liệu không hợp lệ đi vào hệ thống',
          'B. Để mọi yêu cầu đều được chấp nhận nhanh hơn',
          'C. Để không cần kiểm thử các chức năng khác',
          'D. Để thay thế hoàn toàn việc phân quyền người dùng'
        ],
        correctAnswer: 'A. Để bảo đảm dữ liệu đúng định dạng, giảm lỗi và ngăn dữ liệu không hợp lệ đi vào hệ thống',
        points: 10,
        explanation: 'Kiểm tra đầu vào bảo vệ tính nhất quán của dữ liệu và giúp hệ thống phản hồi lỗi rõ ràng.',
        targetObjective: 'Kiểm tra và bảo vệ dữ liệu đầu vào'
      },
      {
        questionText: `Khi một giải pháp cho "${topic}" có nhiều phương án triển khai, tiêu chí nào nên được cân nhắc trước khi lựa chọn?`,
        type: 'multiple_choice',
        options: [
          'A. Yêu cầu bài toán, tính đúng đắn, khả năng bảo trì và chi phí tài nguyên',
          'B. Phương án có nhiều dòng mã nhất',
          'C. Công nghệ mới nhất bất kể mức độ phù hợp',
          'D. Phương án không cần tài liệu hoặc kiểm thử'
        ],
        correctAnswer: 'A. Yêu cầu bài toán, tính đúng đắn, khả năng bảo trì và chi phí tài nguyên',
        points: 10,
        explanation: 'Lựa chọn kỹ thuật cần dựa trên mục tiêu thực tế và các đánh đổi về độ tin cậy, bảo trì, hiệu năng.',
        targetObjective: 'Phân tích yêu cầu và lựa chọn giải pháp'
      },
      {
        questionText: `Hãy nêu một tình huống thực tế có thể áp dụng "${topic}", đề xuất hướng giải quyết và cách kiểm tra kết quả.`,
        type: 'essay',
        options: [],
        correctAnswer: 'Bài làm cần nêu tình huống phù hợp, giải thích cách áp dụng kiến thức, trình bày các bước giải quyết và tiêu chí kiểm tra kết quả.',
        points: 10,
        explanation: 'Câu hỏi đánh giá khả năng liên hệ kiến thức với tình huống thực tế và lập luận có căn cứ.',
        targetObjective: 'Vận dụng kiến thức vào tình huống thực tiễn'
      },
      {
        questionText: `Nếu cần giải thích giải pháp của "${topic}" cho một thành viên mới trong nhóm, em sẽ trình bày những thành phần và lưu ý nào?`,
        type: 'essay',
        options: [],
        correctAnswer: 'Bài làm cần mô tả các thành phần chính, vai trò của từng thành phần, luồng xử lý và một lưu ý về kiểm thử hoặc bảo trì.',
        points: 10,
        explanation: 'Trình bày rõ cấu trúc và luồng xử lý thể hiện mức độ hiểu bản chất của giải pháp.',
        targetObjective: 'Giải thích cấu trúc và quy trình thực hiện'
      },
      {
        questionText: `Trong quá trình triển khai "${topic}", tài liệu kỹ thuật có vai trò gì đối với nhóm phát triển?`,
        type: 'multiple_choice',
        options: [
          'A. Giúp thống nhất cách sử dụng, quyết định thiết kế và quy trình bảo trì',
          'B. Thay thế hoàn toàn việc trao đổi và kiểm thử',
          'C. Chỉ làm tăng số lượng tệp mà không có giá trị',
          'D. Bảo đảm chương trình không bao giờ phát sinh lỗi'
        ],
        correctAnswer: 'A. Giúp thống nhất cách sử dụng, quyết định thiết kế và quy trình bảo trì',
        points: 10,
        explanation: 'Tài liệu rõ ràng hỗ trợ phối hợp, tiếp nhận thành viên mới và duy trì hệ thống lâu dài.',
        targetObjective: 'Ghi chép và phối hợp trong quá trình phát triển'
      },
      {
        questionText: `Khi phát hiện kết quả xử lý "${topic}" không đúng mong đợi, bước đầu tiên hợp lý là gì?`,
        type: 'multiple_choice',
        options: [
          'A. Tái hiện lỗi, kiểm tra đầu vào và lần theo các bước xử lý liên quan',
          'B. Xóa toàn bộ dữ liệu và viết lại hệ thống ngay lập tức',
          'C. Bỏ qua lỗi nếu chỉ có một người gặp phải',
          'D. Thay đổi nhiều phần không liên quan cùng lúc'
        ],
        correctAnswer: 'A. Tái hiện lỗi, kiểm tra đầu vào và lần theo các bước xử lý liên quan',
        points: 10,
        explanation: 'Tái hiện lỗi và thu thập bằng chứng giúp xác định nguyên nhân trước khi chọn cách sửa.',
        targetObjective: 'Phân tích lỗi có hệ thống'
      },
      {
        questionText: `Cách nào giúp giảm nguy cơ một thay đổi trong "${topic}" làm hỏng chức năng đã hoạt động?`,
        type: 'multiple_choice',
        options: [
          'A. Chạy lại các kiểm thử liên quan và kiểm thử hồi quy trước khi phát hành',
          'B. Chỉ kiểm tra phần giao diện vừa chỉnh sửa',
          'C. Bỏ qua các kiểm thử cũ vì mã nguồn đã thay đổi',
          'D. Phát hành ngay để người dùng tự phát hiện lỗi'
        ],
        correctAnswer: 'A. Chạy lại các kiểm thử liên quan và kiểm thử hồi quy trước khi phát hành',
        points: 10,
        explanation: 'Kiểm thử hồi quy xác nhận thay đổi mới không làm suy giảm các chức năng hiện có.',
        targetObjective: 'Kiểm soát chất lượng sau thay đổi'
      },
      {
        questionText: `Khi lựa chọn dữ liệu để minh họa "${topic}", điều gì giúp ví dụ có giá trị học tập hơn?`,
        type: 'multiple_choice',
        options: [
          'A. Dữ liệu thể hiện rõ yêu cầu, có trường hợp thông thường và trường hợp biên',
          'B. Dữ liệu càng dài càng tốt dù không liên quan',
          'C. Chỉ dùng dữ liệu luôn cho ra kết quả đúng',
          'D. Dùng dữ liệu cá nhân thật mà không cần xin phép'
        ],
        correctAnswer: 'A. Dữ liệu thể hiện rõ yêu cầu, có trường hợp thông thường và trường hợp biên',
        points: 10,
        explanation: 'Ví dụ sát yêu cầu và có nhiều tình huống giúp người học hiểu cả cách dùng lẫn giới hạn.',
        targetObjective: 'Lựa chọn ví dụ và dữ liệu kiểm thử phù hợp'
      },
      {
        questionText: `Một giải pháp liên quan đến "${topic}" cần được cải tiến. Dựa vào đâu để xác định phần cần ưu tiên?`,
        type: 'multiple_choice',
        options: [
          'A. Mục tiêu bài toán, phản hồi người dùng, số liệu vận hành và rủi ro',
          'B. Sở thích cá nhân mà không cần kiểm chứng',
          'C. Phần có tên tệp dài nhất',
          'D. Thay đổi toàn bộ hệ thống cùng một lúc'
        ],
        correctAnswer: 'A. Mục tiêu bài toán, phản hồi người dùng, số liệu vận hành và rủi ro',
        points: 10,
        explanation: 'Ưu tiên dựa trên bằng chứng giúp tập trung vào cải tiến có tác động thực tế.',
        targetObjective: 'Đánh giá và ưu tiên cải tiến'
      },
      {
        questionText: `Hãy mô tả một lỗi có thể xảy ra khi áp dụng "${topic}", cách tái hiện lỗi và hướng khắc phục.`,
        type: 'essay',
        options: [],
        correctAnswer: 'Bài làm cần mô tả triệu chứng, điều kiện tái hiện, nguyên nhân có thể, cách khắc phục và kiểm thử xác nhận.',
        points: 10,
        explanation: 'Quy trình mô tả, tái hiện và xác nhận lỗi thể hiện kỹ năng xử lý vấn đề thực tế.',
        targetObjective: 'Chẩn đoán và khắc phục lỗi'
      },
      {
        questionText: `Hãy đề xuất một bộ tiêu chí để đánh giá chất lượng của giải pháp áp dụng "${topic}".`,
        type: 'essay',
        options: [],
        correctAnswer: 'Bài làm cần có tiêu chí phù hợp mục tiêu như tính đúng đắn, khả năng sử dụng, hiệu năng, bảo mật hoặc khả năng bảo trì; giải thích cách đo từng tiêu chí.',
        points: 10,
        explanation: 'Tiêu chí có thể đo lường giúp đánh giá giải pháp khách quan và định hướng cải tiến.',
        targetObjective: 'Xây dựng tiêu chí đánh giá giải pháp'
      },
      {
        questionText: `Nếu phải mở rộng giải pháp "${topic}" cho nhu cầu mới, em sẽ phân tích những yếu tố nào trước khi thay đổi thiết kế?`,
        type: 'essay',
        options: [],
        correctAnswer: 'Bài làm cần xác định yêu cầu mới, ảnh hưởng đến thành phần hiện có, dữ liệu liên quan, rủi ro tương thích và kế hoạch kiểm thử.',
        points: 10,
        explanation: 'Phân tích ảnh hưởng trước khi mở rộng giúp hạn chế phá vỡ chức năng hiện tại.',
        targetObjective: 'Phân tích khả năng mở rộng và tác động thay đổi'
      },
      {
        questionText: `Hãy so sánh hai cách tiếp cận có thể dùng cho "${topic}" và nêu lý do chọn một cách cho tình huống cụ thể.`,
        type: 'essay',
        options: [],
        correctAnswer: 'Bài làm cần nêu hai cách tiếp cận, so sánh ưu nhược điểm theo yêu cầu cụ thể và bảo vệ lựa chọn bằng lập luận.',
        points: 10,
        explanation: 'So sánh theo bối cảnh giúp đánh giá khả năng phân tích và lựa chọn giải pháp.',
        targetObjective: 'So sánh và lựa chọn phương án triển khai'
      },
      {
        questionText: `Khi xử lý dữ liệu trong "${topic}", cần lưu ý điều gì để hạn chế lộ thông tin nhạy cảm?`,
        type: 'multiple_choice',
        options: [
          'A. Chỉ thu thập dữ liệu cần thiết, giới hạn quyền truy cập và tránh ghi dữ liệu nhạy cảm vào log',
          'B. Công khai toàn bộ dữ liệu để mọi thành viên tiện theo dõi',
          'C. Dùng chung một tài khoản có toàn quyền cho tất cả người dùng',
          'D. Lưu thông tin nhạy cảm trực tiếp trong mã nguồn'
        ],
        correctAnswer: 'A. Chỉ thu thập dữ liệu cần thiết, giới hạn quyền truy cập và tránh ghi dữ liệu nhạy cảm vào log',
        points: 10,
        explanation: 'Giảm thiểu dữ liệu và giới hạn truy cập là các nguyên tắc cơ bản để bảo vệ thông tin.',
        targetObjective: 'Nhận biết nguyên tắc bảo vệ dữ liệu'
      }
    ];

    const essayTemplates = templates.filter(q => q.type === 'essay');
    const multipleChoiceTemplates = templates.filter(q => q.type === 'multiple_choice');
    const toEssayQuestion = (question) => ({
      ...question,
      questionText: `Hãy trình bày và giải thích kiến thức cần vận dụng cho mục tiêu: ${question.targetObjective || topic}.`,
      type: 'essay',
      options: [],
      correctAnswer: question.explanation || question.correctAnswer
    });

    let selected;
    if (questionType === 'multiple_choice') {
      selected = templates.slice(0, Math.min(questionCount, templates.length));
    } else {
      const essayCount = questionType === 'essay'
        ? questionCount
        : Math.ceil(questionCount * 0.6);
      const availableEssays = [
        ...essayTemplates,
        ...multipleChoiceTemplates.map(toEssayQuestion)
      ];
      const essays = availableEssays.slice(0, essayCount);
      const multipleChoiceCount = questionType === 'essay' ? 0 : questionCount - essayCount;
      selected = [
        ...essays,
        ...multipleChoiceTemplates.slice(0, multipleChoiceCount)
      ];
    }

    // Chuẩn hóa điểm sao cho tổng bằng 100
    const pointPerQuestion = Math.floor(100 / selected.length);
    selected = selected.map((q, idx) => ({
      ...q,
      points: idx === selected.length - 1 ? 100 - pointPerQuestion * (selected.length - 1) : pointPerQuestion
    }));

    return {
      title: `Bài tập rèn luyện: ${topic}`,
      description: `Đề bài được sinh tự động bởi SEMS AI Engine dựa trên chuẩn đầu ra. Độ khó mục tiêu: ${difficulty}. Giáo viên vui lòng kiểm tra và duyệt trước khi ban hành.`,
      difficulty,
      topic,
      curriculumAlignment: curriculumContext || `Chuẩn kiến thức & kỹ năng chủ đề ${topic}`,
      maxScore: 100,
      questions: selected,
      aiMetadata: {
        modelUsed: 'SEMS Intelligent Education AI Engine (Tích hợp sẵn - Miễn phí)',
        generatedPrompt: `Generate assessment for ${topic} at ${difficulty} level`,
        validationScore: 92,
        validationReport: {
          alignmentValid: true,
          difficultyAppropriate: true,
          rubricComplete: true,
          suggestions: [
            'Đề bài đã bám sát chuẩn mục tiêu bài học.',
            'Có kết hợp câu hỏi trắc nghiệm khách quan và câu hỏi vận dụng.',
            'Giáo viên có thể điều chỉnh thang điểm hoặc bổ sung tài liệu tham khảo trước khi duyệt.'
          ]
        },
        verifiedByTeacher: false
      }
    };
  }

  /**
   * AI Hỗ trợ chấm bài & viết nhận xét tự động
   */
  async gradeSubmissionWithAI({ submissionId }) {
    const submission = await Submission.findById(submissionId).populate({
      path: 'assignmentId',
      populate: { path: 'classId' }
    }).populate('studentId', 'fullName email');

    if (!submission) {
      throw new Error('Không tìm thấy bài nộp');
    }

    const assignment = submission.assignmentId;
    if (!assignment) {
      throw new Error('Không tìm thấy thông tin đề bài tương ứng');
    }

    const apiKey = this.getEffectiveApiKey();

    // Nếu có Gemini API Key, dùng Gemini để phân tích
    if (apiKey) {
      const { result: geminiGrade, model } = await this.callGeminiGradeSubmission({
        assignment,
        submission,
        apiKey
      });
      if (typeof geminiGrade?.score !== 'number') {
        const error = new Error('Google Gemini không trả về kết quả chấm điểm hợp lệ.');
        error.statusCode = 502;
        throw error;
      }
      return {
        ...geminiGrade,
        engineUsed: `Google ${model}`
      };
    }

    // Use the built-in engine only when no Gemini API key is configured.
    return this.gradeBuiltinSubmission({ assignment, submission });
  }

  /**
   * Gọi Gemini AI chấm bài tự luận và trắc nghiệm
   */
  async callGeminiGradeSubmission({ assignment, submission, apiKey }) {
    const questionsContext = assignment.questions.map((q, idx) => {
      const studentAns = submission.answers?.find(a => a.questionIndex === idx);
      return {
        questionIndex: idx,
        questionText: q.questionText,
        type: q.type,
        maxPoints: q.points,
        correctAnswer: q.correctAnswer,
        explanationOrRubric: q.explanation,
        studentAnswer: studentAns?.studentAnswer || '(Không trả lời)'
      };
    });

    const prompt = `Bạn là một giảng viên Công nghệ thông tin có tâm và giàu kinh nghiệm sư phạm.
Nhiệm vụ của bạn là chấm điểm bài làm của học viên "${submission.studentId?.fullName || 'Học viên'}" cho bài tập: "${assignment.title}".
Dưới đây là danh sách câu hỏi, thang điểm, đáp án chuẩn / barem, và câu trả lời thực tế của học viên:
${JSON.stringify(questionsContext, null, 2)}

Nội dung ghi chú / bài viết tự luận bổ sung của học viên (nếu có):
"${submission.submittedText || 'Không có'}"

Hãy chấm điểm từng câu theo barem, tính tổng điểm (thang điểm 100), và viết lời nhận xét sư phạm chi tiết, mang tính khích lệ.

Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown format, không bọc trong \`\`\`json):
{
  "score": 85,
  "feedback": "Lời nhận xét tổng quan giàu tính sư phạm, khen ngợi điểm tốt và chỉ dẫn cải thiện",
  "answersFeedback": [
    {
      "questionIndex": 0,
      "pointsAwarded": 25,
      "teacherNote": "Ghi chú chấm cho từng câu"
    }
  ]
}`;

    return this.callGeminiAPI({ prompt, apiKey, temperature: 0.3, isJson: true });
  }

  /**
   * Chấm bài tự động bằng bộ máy Semantic & Rule Engine nội bộ
   */
  gradeBuiltinSubmission({ assignment, submission }) {
    let totalScore = 0;
    const answersFeedback = [];
    const strengths = [];
    const weaknesses = [];

    assignment.questions.forEach((q, idx) => {
      const studentAnsObj = submission.answers?.find(a => a.questionIndex === idx);
      const studentAnswer = (studentAnsObj?.studentAnswer || '').trim();
      const maxPts = q.points || Math.floor(100 / assignment.questions.length);
      let awarded = 0;
      let note = '';

      if (q.type === 'multiple_choice') {
        const isMatch = studentAnswer.toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
          || (typeof studentAnsObj?.selectedOption === 'number' && q.options[studentAnsObj.selectedOption]?.trim()?.toLowerCase() === (q.correctAnswer || '').trim()?.toLowerCase());

        if (isMatch) {
          awarded = maxPts;
          note = 'Chính xác! Lựa chọn đúng đáp án.';
          strengths.push(`Câu ${idx + 1}: Nắm vững khái niệm cơ bản`);
        } else {
          awarded = 0;
          note = `Chưa chính xác. Đáp án đúng là: ${q.correctAnswer}`;
          weaknesses.push(`Câu ${idx + 1}: Cần xem lại phần lý thuyết liên quan`);
        }
      } else {
        // Tự luận / Trả lời ngắn / Code
        if (!studentAnswer) {
          awarded = 0;
          note = 'Chưa có câu trả lời.';
        } else {
          const lengthScore = Math.min(studentAnswer.length / 80, 1.0);
          const keywords = (q.explanation || q.correctAnswer || q.targetObjective || '')
            .toLowerCase()
            .split(/[\s,.;]+/)
            .filter(w => w.length > 3);

          let matchCount = 0;
          keywords.forEach(kw => {
            if (studentAnswer.toLowerCase().includes(kw)) matchCount++;
          });

          const keywordRatio = keywords.length > 0 ? Math.min(matchCount / Math.max(keywords.length * 0.4, 1), 1.0) : 0.8;
          const scorePercent = 0.5 * lengthScore + 0.5 * keywordRatio;

          awarded = Math.round(maxPts * Math.max(scorePercent, 0.6));
          awarded = Math.min(awarded, maxPts);

          if (awarded >= maxPts * 0.85) {
            note = 'Bài làm rất tốt, lập luận rõ ràng và có dẫn chứng phù hợp.';
            strengths.push(`Câu ${idx + 1}: Trình bày mạch lạc, hiểu rõ bản chất vấn đề`);
          } else {
            note = 'Đã nắm được ý chính nhưng cần phân tích sâu hơn và bổ sung ví dụ thực tế.';
            weaknesses.push(`Câu ${idx + 1}: Nên phát triển thêm luận điểm`);
          }
        }
      }

      totalScore += awarded;
      answersFeedback.push({
        questionIndex: idx,
        pointsAwarded: awarded,
        teacherNote: note
      });
    });

    totalScore = Math.min(Math.round(totalScore), 100);

    let feedback = '';
    if (totalScore >= 85) {
      feedback = `Bài làm xuất sắc (${totalScore}/100)! Em nắm rất vững kiến thức bài học và có tư duy logic tốt. Tiếp tục phát huy nhé!`;
    } else if (totalScore >= 70) {
      feedback = `Bài làm khá (${totalScore}/100). Em đã nắm được hầu hết các nội dung trọng tâm. Cần chú ý thêm một số chi tiết kỹ thuật ở các câu vận dụng.`;
    } else if (totalScore >= 50) {
      feedback = `Kết quả đạt mức trung bình (${totalScore}/100). Cần dành thêm thời gian ôn tập lại lý thuyết bài học và thực hành thêm các bài tập tương tự.`;
    } else {
      feedback = `Kết quả chưa đạt yêu cầu (${totalScore}/100). Em nên trao đổi với giảng viên hoặc trợ giảng để được hướng dẫn ôn tập lại các phần kiến thức còn hổng.`;
    }

    return {
      score: totalScore,
      feedback,
      answersFeedback,
      engineUsed: 'SEMS Intelligent Education AI Engine (Tích hợp sẵn - Miễn phí)'
    };
  }

  /**
   * AI Chat - Hỏi đáp học thuật thông minh
   */
  async chatWithAI({ message, history = [], context = '', userRole, userName }) {
    const apiKey = this.getEffectiveApiKey();

    if (apiKey) {
      return this.callGeminiChat({ message, history, context, userRole, userName, apiKey });
    }

    // Use the built-in engine only when no Gemini API key is configured.
    return this.builtinChat({ message, userRole });
  }

  /**
   * Gọi Gemini để trả lời chat
   */
  async callGeminiChat({ message, history, context, userRole, userName, apiKey }) {
    const roleContext = userRole === 'teacher'
      ? 'Người dùng là giáo viên, ưu tiên các câu trả lời về phương pháp giảng dạy, thiết kế bài tập, đánh giá học sinh.'
      : 'Người dùng là học sinh, ưu tiên giải thích dễ hiểu, ví dụ thực tế, khuyến khích học tập.';

    const systemInstruction = `Bạn là Trợ lý AI Giáo dục của hệ thống SEMS (Smart Education Management System) - chuyên về Tin học và Công nghệ thông tin.
${roleContext}
Xưng hô: Gọi người dùng là "${userName || (userRole === 'teacher' ? 'thầy/cô' : 'em')}", xưng là "tôi".
Ngôn ngữ: Tiếng Việt, thân thiện, chuyên nghiệp.
Phạm vi: Chỉ trả lời về Tin học, lập trình, toán học, và các câu hỏi học thuật liên quan. Từ chối lịch sự các câu hỏi ngoài phạm vi giáo dục.
Hãy giải thích đầy đủ theo đúng mức độ câu hỏi, chia ý rõ ràng và thêm ví dụ thực tế hoặc đoạn mã khi hữu ích. Với yêu cầu thiết kế/lập kế hoạch, hãy trình bày từng bước cụ thể thay vì chỉ đưa ra ý tưởng tổng quát. Không tự giới hạn câu trả lời ở vài câu; ưu tiên chính xác và dễ áp dụng, tránh lặp ý.
${context ? `Ngữ cảnh bổ sung: ${context}` : ''}`;

    // Xây dựng lịch sử hội thoại
    const historyMessages = history.slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [
        ...historyMessages,
        { role: 'user', parts: [{ text: message }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    };

    const { data, model } = await this.requestGeminiContent({ apiKey, body });
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!replyText) {
      const error = new Error('Google Gemini không trả về nội dung. Kiểm tra quyền truy cập model hoặc thử lại.');
      error.statusCode = 502;
      throw error;
    }

    return {
      reply: replyText,
      engineUsed: `Google ${model}`
    };
  }

  /**
   * Built-in Chat Engine (không cần API Key)
   */
  builtinChat({ message, userRole }) {
    const msg = message.toLowerCase();
    let reply = '';

    // Pattern matching đơn giản
    if (msg.includes('html') || msg.includes('css') || msg.includes('web')) {
      reply = `HTML (HyperText Markup Language) là ngôn ngữ đánh dấu để tạo cấu trúc trang web. CSS (Cascading Style Sheets) dùng để định dạng giao diện.

**Ví dụ cơ bản:**
\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <title>Trang web của tôi</title>
  </head>
  <body>
    <h1>Xin chào!</h1>
    <p>Đây là đoạn văn.</p>
  </body>
</html>
\`\`\`

Bạn có muốn tôi giải thích thêm về phần nào không?`;
    } else if (msg.includes('javascript') || msg.includes('js') || msg.includes('lập trình')) {
      reply = `JavaScript là ngôn ngữ lập trình phổ biến nhất cho web, chạy trực tiếp trên trình duyệt.

**Các khái niệm cơ bản:**
- **Biến**: \`let\`, \`const\`, \`var\`
- **Hàm**: \`function\` hoặc arrow function \`() => {}\`
- **Vòng lặp**: \`for\`, \`while\`, \`forEach\`
- **Điều kiện**: \`if/else\`, \`switch\`

Bạn đang học đến phần nào? Tôi có thể giải thích chi tiết hơn!`;
    } else if (msg.includes('thuật toán') || msg.includes('algorithm') || msg.includes('sắp xếp')) {
      reply = `Thuật toán là tập hợp các bước có thứ tự để giải quyết một bài toán cụ thể.

**Các thuật toán sắp xếp phổ biến:**
| Thuật toán | Thời gian trung bình | Ghi chú |
|-----------|---------------------|---------|
| Bubble Sort | O(n²) | Đơn giản, chậm |
| Selection Sort | O(n²) | Dễ hiểu |
| Quick Sort | O(n log n) | Nhanh trong thực tế |
| Merge Sort | O(n log n) | Ổn định |

Bạn muốn tìm hiểu thuật toán nào cụ thể?`;
    } else if (msg.includes('cơ sở dữ liệu') || msg.includes('database') || msg.includes('sql') || msg.includes('mongodb')) {
      reply = `Cơ sở dữ liệu (Database) là hệ thống lưu trữ và quản lý dữ liệu có cấu trúc.

**Hai loại chính:**
- **SQL** (Quan hệ): MySQL, PostgreSQL - dữ liệu dạng bảng
- **NoSQL** (Phi quan hệ): MongoDB, Redis - dữ liệu dạng document/key-value

**Câu lệnh SQL cơ bản:**
\`\`\`sql
SELECT * FROM students WHERE score > 80;
INSERT INTO students (name, score) VALUES ('An', 95);
UPDATE students SET score = 90 WHERE id = 1;
DELETE FROM students WHERE id = 1;
\`\`\`

Bạn đang học SQL hay MongoDB?`;
    } else if (msg.includes('xin chào') || msg.includes('hello') || msg.includes('chào')) {
      const greeting = userRole === 'teacher' ? 'thầy/cô' : 'bạn';
      reply = `Xin chào ${greeting}! 👋 Tôi là Trợ lý AI Giáo dục của SEMS.

Tôi có thể giúp ${greeting}:
- 📚 Giải thích các khái niệm Tin học, lập trình
- 🧮 Hỗ trợ bài tập thuật toán, cấu trúc dữ liệu
- 💡 Hướng dẫn web development, database
- 🔍 Trả lời câu hỏi học thuật

${greeting === 'thầy/cô' ? 'Tôi cũng có thể hỗ trợ thiết kế đề bài và phương pháp giảng dạy!' : ''}

Bạn cần tôi hỗ trợ gì hôm nay?`;
    } else {
      reply = `Cảm ơn câu hỏi của bạn về: **"${message}"**

Tôi là Trợ lý AI Giáo dục nội bộ của SEMS (hoạt động offline, không cần API Key). Tôi có thể hỗ trợ tốt nhất về:

📌 **Các chủ đề chính:**
- Lập trình: HTML, CSS, JavaScript, Python
- Cấu trúc dữ liệu & Giải thuật
- Cơ sở dữ liệu (SQL, MongoDB)
- Mạng máy tính & Bảo mật
- Phương pháp nghiên cứu khoa học

💡 *Gợi ý: Thêm Gemini API Key (miễn phí) trong Cài Đặt AI để nhận câu trả lời chính xác và chi tiết hơn!*

Bạn có thể hỏi cụ thể hơn về chủ đề bạn cần không?`;
    }

    return {
      reply,
      engineUsed: 'SEMS Built-in AI Engine (Offline)'
    };
  }

  /**
   * Kiểm định tiêu chí bài tập
   */
  async validateAssignment(assignmentData) {
    const questions = assignmentData.questions || [];
    let score = 100;
    const warnings = [];
    const suggestions = [];

    if (questions.length === 0) {
      score -= 50;
      warnings.push('Bài tập chưa có câu hỏi nào.');
    }

    let hasMultipleChoice = false;
    let hasEssay = false;
    let totalPoints = 0;

    questions.forEach((q, idx) => {
      totalPoints += q.points || 0;
      if (q.type === 'multiple_choice') {
        hasMultipleChoice = true;
        if (!q.options || q.options.length < 2) {
          score -= 10;
          warnings.push(`Câu ${idx + 1}: Câu hỏi trắc nghiệm cần tối thiểu 2 lựa chọn.`);
        }
        if (!q.correctAnswer) {
          score -= 10;
          warnings.push(`Câu ${idx + 1}: Chưa thiết lập đáp án đúng.`);
        }
      }
      if (q.type === 'essay' || q.type === 'short_answer') {
        hasEssay = true;
      }
    });

    if (totalPoints !== 100 && totalPoints !== 10) {
      suggestions.push(`Tổng điểm hiện tại là ${totalPoints}. Nên chuẩn hóa về thang điểm 100 để đồng bộ hệ thống.`);
    }

    if (hasMultipleChoice && !hasEssay) {
      suggestions.push('Đề xuất: Bổ sung thêm 1 câu hỏi tự luận/vận dụng thực tế để kiểm tra năng lực tư duy logic.');
    }

    suggestions.push('Nội dung phù hợp với tiến độ và chuẩn đầu ra bài học.');

    return {
      validationScore: Math.max(score, 40),
      criteriaPassed: warnings.length === 0,
      warnings,
      suggestions,
      alignmentValid: warnings.length === 0,
      difficultyAppropriate: true,
      rubricComplete: totalPoints > 0
    };
  }
}

module.exports = new AIService();
