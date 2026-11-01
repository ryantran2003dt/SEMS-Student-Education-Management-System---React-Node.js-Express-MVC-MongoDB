import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Smile,
  X
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';

const roleLabels = {
  admin: 'Quản lý',
  teacher: 'Giáo viên',
  student: 'Học viên',
  parent: 'Phụ huynh'
};
const stickers = ['😀', '😄', '🥰', '😂', '👏', '👍', '❤️', '🎉', '🤔', '🙏', '💪', '🌟'];

function formatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(size = 0) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function messagePreview(message) {
  if (!message) return '';
  if (message.type === 'image') return 'Đã gửi một ảnh';
  if (message.type === 'file') return `Đã gửi tệp: ${message.attachment?.name || 'Tệp đính kèm'}`;
  if (message.type === 'sticker') return 'Đã gửi sticker';
  return message.text;
}

function AuthenticatedAttachment({ attachment, isImage, isOwnMessage }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let downloadedUrl = '';
    setObjectUrl('');
    setError('');

    const apiPath = attachment.url.replace(/^\/api(?=\/)/, '');
    api.get(apiPath, { responseType: 'blob' })
      .then((response) => {
        downloadedUrl = URL.createObjectURL(response);
        if (active) {
          setObjectUrl(downloadedUrl);
        } else {
          URL.revokeObjectURL(downloadedUrl);
        }
      })
      .catch((downloadError) => {
        if (active) setError(downloadError.message);
      });

    return () => {
      active = false;
      if (downloadedUrl) URL.revokeObjectURL(downloadedUrl);
    };
  }, [attachment.url]);

  if (error) {
    return <p role="alert" className="mb-2 text-xs text-red-600">Không tải được tệp: {error}</p>;
  }
  if (!objectUrl) {
    return <p className={`mb-2 text-xs ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>Đang tải tệp...</p>;
  }
  if (isImage) {
    return (
      <a href={objectUrl} target="_blank" rel="noreferrer">
        <img
          src={objectUrl}
          alt={attachment.name || 'Ảnh đính kèm'}
          className="mb-2 max-h-64 max-w-full rounded-lg object-contain"
        />
      </a>
    );
  }

  return (
    <a
      href={objectUrl}
      download={attachment.name}
      className={`mb-2 flex min-w-48 items-center gap-2 rounded-lg p-2 ${
        isOwnMessage ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-700'
      }`}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold">{attachment.name}</span>
        <span className={`text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
          {formatFileSize(attachment.size)}
        </span>
      </span>
    </a>
  );
}

export default function MessageCenter() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadConversations = useCallback(async () => {
    const response = await api.get('/messages/conversations');
    setConversations(response.data || []);
  }, []);

  useEffect(() => {
    let active = true;
    const loadContacts = async () => {
      try {
        const [contactsResponse, conversationsResponse] = await Promise.all([
          api.get('/messages/contacts'),
          api.get('/messages/conversations')
        ]);
        if (!active) return;
        const contactList = contactsResponse.data || [];
        const conversationList = conversationsResponse.data || [];
        setContacts(contactList);
        setConversations(conversationList);
        const firstContact = conversationList[0]?.peer
          || contactList[0]
          || null;
        setSelectedContact(firstContact);
        if (firstContact) setShowThreadOnMobile(true);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadContacts();
    return () => { active = false; };
  }, []);

  const loadThread = useCallback(async (contactId) => {
    if (!contactId) {
      setMessages([]);
      return;
    }
    try {
      const response = await api.get(`/messages/${contactId}`);
      setMessages(response.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadThread(selectedContact?._id);
  }, [selectedContact?._id, loadThread]);

  useEffect(() => {
    if (!selectedContact?._id) return undefined;
    const intervalId = window.setInterval(async () => {
      try {
        await loadConversations();
        await loadThread(selectedContact._id);
      } catch (pollError) {
        setError(pollError.message);
      }
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadConversations, loadThread, selectedContact?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const conversationByContact = useMemo(
    () => new Map(conversations.map((conversation) => [String(conversation.peer._id), conversation])),
    [conversations]
  );

  const visibleContacts = useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase('vi');
    return [...contacts]
      .filter((contact) => contact.fullName.toLocaleLowerCase('vi').includes(search))
      .sort((a, b) => {
        const aTime = new Date(conversationByContact.get(String(a._id))?.lastMessage?.createdAt || 0).getTime();
        const bTime = new Date(conversationByContact.get(String(b._id))?.lastMessage?.createdAt || 0).getTime();
        return bTime - aTime || a.fullName.localeCompare(b.fullName, 'vi');
      });
  }, [contacts, conversationByContact, searchText]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if ((!text && !selectedFile) || !selectedContact || sending) return;

    setSending(true);
    setError('');
    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (text) formData.append('text', text);
        response = await api.post(`/messages/${selectedContact._id}`, formData, {
          headers: { 'Content-Type': undefined }
        });
      } else {
        response = await api.post(`/messages/${selectedContact._id}`, { text });
      }
      setMessages((currentMessages) => [...currentMessages, response.data]);
      setMessageText('');
      setSelectedFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadConversations();
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  };

  const sendSticker = async (sticker) => {
    if (!selectedContact || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await api.post(`/messages/${selectedContact._id}`, {
        type: 'sticker',
        text: sticker
      });
      setMessages((currentMessages) => [...currentMessages, response.data]);
      setShowStickers(false);
      await loadConversations();
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Tệp không được vượt quá 20 MB.');
      event.target.value = '';
      return;
    }
    setError('');
    setSelectedFile(file);
    setShowStickers(false);
  };

  const selectContact = (contact) => {
    setSelectedContact(contact);
    setShowThreadOnMobile(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tin nhắn</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trao đổi với người liên quan đến lớp học. Tin nhắn được cập nhật tự động mỗi 5 giây.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid h-[min(70vh,720px)] min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[280px_minmax(0,1fr)]">
        <section className={`${showThreadOnMobile ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-slate-200`}>
          <div className="border-b border-slate-100 p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Danh bạ</h2>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-400 focus-within:border-blue-400">
              <Search className="h-4 w-4 shrink-0" />
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm người liên hệ"
                className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
            ) : visibleContacts.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs leading-5 text-slate-500">
                Chưa có người liên hệ phù hợp. Danh bạ hiển thị theo lớp học và quan hệ đã xác minh.
              </p>
            ) : visibleContacts.map((contact) => {
              const conversation = conversationByContact.get(String(contact._id));
              const isSelected = selectedContact?._id === contact._id;
              return (
                <button
                  type="button"
                  key={contact._id}
                  onClick={() => selectContact(contact)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {contact.fullName.slice(0, 1).toLocaleUpperCase('vi')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800">{contact.fullName}</span>
                      {conversation?.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-indigo-600">
                      {roleLabels[contact.role] || 'Người dùng'}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {messagePreview(conversation?.lastMessage) || roleLabels[contact.role] || 'Người dùng'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`${showThreadOnMobile ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-col`}>
          {selectedContact ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowThreadOnMobile(false)}
                  aria-label="Quay lại danh bạ"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {selectedContact.fullName.slice(0, 1).toLocaleUpperCase('vi')}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-800">{selectedContact.fullName}</h2>
                  <p className="text-[11px] text-slate-500">{roleLabels[selectedContact.role] || 'Người dùng'}</p>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                    <MessageCircle className="mb-2 h-8 w-8" />
                    <p className="text-sm font-medium">Bắt đầu cuộc trò chuyện</p>
                    <p className="mt-1 text-xs">Gửi tin nhắn đầu tiên cho {selectedContact.fullName}.</p>
                  </div>
                ) : messages.map((message) => {
                  const isOwnMessage = String(message.senderId) === String(user?._id);
                  return (
                    <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                        isOwnMessage
                          ? 'rounded-br-md bg-blue-600 text-white'
                          : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                      }`}>
                        {message.type === 'sticker' ? (
                          <p aria-label="Sticker" className="text-5xl leading-tight">{message.text}</p>
                        ) : (
                          <>
                            {['image', 'file'].includes(message.type) && message.attachment?.url && (
                              <AuthenticatedAttachment
                                attachment={message.attachment}
                                isImage={message.type === 'image'}
                                isOwnMessage={isOwnMessage}
                              />
                            )}
                            {message.text && (
                              <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                            )}
                          </>
                        )}
                        {message.type !== 'text' && (
                          <p className={`mt-1 text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                            {message.type === 'image' ? 'Ảnh' : message.type === 'file' ? 'Tệp' : 'Sticker'}
                          </p>
                        )}
                        <p className={`mt-1 text-right text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3">
                {selectedFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {selectedFile.type.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    <span className="min-w-0 flex-1 truncate">{selectedFile.name} · {formatFileSize(selectedFile.size)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (imageInputRef.current) imageInputRef.current.value = '';
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      aria-label="Bỏ tệp đính kèm"
                      className="rounded p-1 hover:bg-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <div className="relative flex shrink-0 items-center gap-1">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelection}
                      className="hidden"
                      aria-label="Chọn ảnh"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.zip"
                      onChange={handleFileSelection}
                      className="hidden"
                      aria-label="Chọn tệp"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      title="Gửi ảnh"
                      aria-label="Gửi ảnh"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Gửi tệp"
                      aria-label="Gửi tệp"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStickers((visible) => !visible)}
                      title="Emoji và sticker"
                      aria-label="Mở emoji và sticker"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {showStickers && (
                      <div className="absolute bottom-12 left-0 z-10 grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        {stickers.map((sticker) => (
                          <button
                            type="button"
                            key={sticker}
                            onClick={() => sendSticker(sticker)}
                            disabled={sending}
                            aria-label={`Gửi sticker ${sticker}`}
                            className="rounded-lg p-2 text-2xl hover:bg-slate-100 disabled:opacity-50"
                          >
                            {sticker}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea
                    rows={1}
                    maxLength={3000}
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form.requestSubmit();
                      }
                    }}
                    placeholder={selectedFile ? 'Thêm lời nhắn (không bắt buộc)...' : 'Nhập tin nhắn...'}
                    aria-label="Nội dung tin nhắn"
                    className="max-h-32 min-h-10 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={(!messageText.trim() && !selectedFile) || sending}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="hidden sm:inline">Gửi</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageCircle className="mb-3 h-10 w-10" />
              <p className="text-sm font-medium">Chọn người để bắt đầu nhắn tin</p>
              <p className="mt-1 text-xs">Danh bạ được giới hạn theo vai trò và quan hệ lớp học.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
