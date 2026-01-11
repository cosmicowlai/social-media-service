const { useEffect, useMemo, useRef, useState } = React;

const apiBaseUrl = 'http://localhost:3000';
const socketBaseUrl = 'http://localhost:3001';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__subtitle">Microservices Chat Platform</p>
          <h1>Chat & Call Studio</h1>
        </div>
        <nav className="tabs">
          <button
            className={activeTab === 'chat' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('chat')}
            type="button"
          >
            Chats
          </button>
          <button
            className={activeTab === 'call' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('call')}
            type="button"
          >
            Calls
          </button>
        </nav>
      </header>

      <main className="app__main">
        {activeTab === 'chat' ? <ChatPanel /> : <CallPanel />}
      </main>
    </div>
  );
}

function ChatPanel() {
  const [userId, setUserId] = useState('user-1');
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [newConversationName, setNewConversationName] = useState('Product Sync');
  const [memberOne, setMemberOne] = useState('user-2');
  const [memberTwo, setMemberTwo] = useState('user-3');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);

  const membersPayload = useMemo(() => {
    const base = [{ userId, displayName }];
    return base.concat([
      { userId: memberOne, displayName: 'Jordan Blake' },
      { userId: memberTwo, displayName: 'Taylor Quinn' },
    ]);
  }, [userId, displayName, memberOne, memberTwo]);

  useEffect(() => {
    const socket = window.io(socketBaseUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('presence:join', { userId, displayName });
    });

    socket.on('presence:update', (users) => {
      setOnlineUsers(users);
    });

    socket.on('typing:update', (payload) => {
      if (!selectedConversation || payload.conversationId !== selectedConversation.id) {
        return;
      }
      setTypingUsers((prev) => {
        const filtered = prev.filter((user) => user.userId !== payload.userId);
        return payload.isTyping ? [...filtered, payload] : filtered;
      });
    });

    socket.on('message:created', (message) => {
      if (selectedConversation?.id !== message.conversationId) {
        return;
      }
      setMessages((prev) => [...prev, message]);
    });

    socket.on('message:updated', (message) => {
      setMessages((prev) =>
        prev.map((entry) => (entry.id === message.id ? message : entry)),
      );
    });

    socket.on('message:deleted', (message) => {
      setMessages((prev) => prev.filter((entry) => entry.id !== message.id));
    });

    return () => {
      socket.disconnect();
    };
  }, [displayName, userId, selectedConversation]);

  useEffect(() => {
    fetch(`${apiBaseUrl}/conversations/user/${userId}`)
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch(() => setConversations([]));
  }, [userId]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    fetch(`${apiBaseUrl}/conversations/${selectedConversation.id}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => setMessages([]));
  }, [selectedConversation]);

  const createConversation = (type) => {
    fetch(`${apiBaseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: type === 'group' ? newConversationName : undefined,
        type,
        members: type === 'group' ? membersPayload : membersPayload.slice(0, 2),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setConversations((prev) => [data, ...prev]);
        setSelectedConversation(data);
      });
  };

  const sendMessage = () => {
    if (!selectedConversation || !messageBody.trim()) {
      return;
    }

    fetch(`${apiBaseUrl}/conversations/${selectedConversation.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: userId,
        body: messageBody.trim(),
      }),
    }).then(() => {
      setMessageBody('');
      emitTyping(false);
    });
  };

  const updateMessage = (messageId, body) =>
    fetch(`${apiBaseUrl}/conversations/${selectedConversation.id}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }).then((res) => res.json());

  const deleteMessage = (messageId) =>
    fetch(`${apiBaseUrl}/conversations/${selectedConversation.id}/messages/${messageId}`, {
      method: 'DELETE',
    }).then((res) => res.json());

  const emitTyping = (isTyping) => {
    if (!socketRef.current || !selectedConversation) {
      return;
    }

    socketRef.current.emit('typing:update', {
      conversationId: selectedConversation.id,
      userId,
      displayName,
      isTyping,
    });
  };

  return (
    <section className="panel">
      <div className="panel__column">
        <h2>Profile</h2>
        <label className="field">
          User Id
          <input value={userId} onChange={(event) => setUserId(event.target.value)} />
        </label>
        <label className="field">
          Display Name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>

        <h2>Online Users</h2>
        <ul className="pill-list">
          {onlineUsers.map((user) => (
            <li key={user.userId} className="pill">
              {user.displayName}
            </li>
          ))}
          {onlineUsers.length === 0 && <li>No one online yet.</li>}
        </ul>

        <h2>Create Conversation</h2>
        <label className="field">
          Group Name
          <input
            value={newConversationName}
            onChange={(event) => setNewConversationName(event.target.value)}
          />
        </label>
        <label className="field">
          Member One
          <input value={memberOne} onChange={(event) => setMemberOne(event.target.value)} />
        </label>
        <label className="field">
          Member Two
          <input value={memberTwo} onChange={(event) => setMemberTwo(event.target.value)} />
        </label>
        <div className="button-row">
          <button type="button" onClick={() => createConversation('one_to_one')}>
            New 1:1
          </button>
          <button type="button" onClick={() => createConversation('group')}>
            New Group
          </button>
        </div>
      </div>

      <div className="panel__column panel__column--wide">
        <h2>Conversations</h2>
        <div className="card-list">
          {conversations.map((conversation) => (
            <button
              className={
                selectedConversation?.id === conversation.id
                  ? 'card card--active'
                  : 'card'
              }
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              type="button"
            >
              <h3>{conversation.name || 'Direct Chat'}</h3>
              <p>{conversation.type === 'group' ? 'Group chat' : '1:1 chat'}</p>
              <span>{conversation.members.length} members</span>
            </button>
          ))}
          {conversations.length === 0 && <p>No conversations yet.</p>}
        </div>
      </div>

      <div className="panel__column panel__column--wide">
        <h2>Messages</h2>
        <div className="messages">
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              onDelete={() => deleteMessage(message.id)}
              onUpdate={(body) => updateMessage(message.id, body)}
            />
          ))}
          {messages.length === 0 && <p>No messages loaded.</p>}
        </div>
        {typingUsers.length > 0 && (
          <p className="typing-indicator">
            {typingUsers.map((user) => user.displayName).join(', ')} typing...
          </p>
        )}
        <div className="message-composer">
          <input
            placeholder="Write a message"
            value={messageBody}
            onChange={(event) => {
              setMessageBody(event.target.value);
              emitTyping(event.target.value.length > 0);
            }}
            onBlur={() => emitTyping(false)}
          />
          <button type="button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

function MessageRow({ message, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  useEffect(() => {
    setDraft(message.body);
  }, [message.body]);

  const save = () => {
    if (!draft.trim()) {
      return;
    }
    onUpdate(draft.trim()).then(() => setIsEditing(false));
  };

  return (
    <div className="message">
      <div className="message__meta">
        <strong>{message.senderId}</strong>
        <span>{new Date(message.sentAt).toLocaleTimeString()}</span>
      </div>
      {isEditing ? (
        <div className="message__edit">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} />
          <div className="message__actions">
            <button type="button" onClick={save}>
              Save
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p>{message.body}</p>
      )}
      {!isEditing && (
        <div className="message__actions">
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function CallPanel() {
  const [conversationId, setConversationId] = useState('');
  const [callType, setCallType] = useState('video');
  const [participants, setParticipants] = useState('user-1,user-2');
  const [calls, setCalls] = useState([]);
  const [localStream, setLocalStream] = useState(null);

  const startCall = () => {
    const payload = {
      conversationId,
      type: callType,
      participants: participants
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((id) => ({ userId: id, displayName: id })),
    };

    fetch(`${apiBaseUrl}/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => setCalls((prev) => [data, ...prev]));
  };

  const requestMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    setLocalStream(stream);
  };

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    fetch(`${apiBaseUrl}/calls/conversation/${conversationId}`)
      .then((res) => res.json())
      .then((data) => setCalls(data))
      .catch(() => setCalls([]));
  }, [conversationId]);

  return (
    <section className="panel">
      <div className="panel__column">
        <h2>Call Setup</h2>
        <label className="field">
          Conversation Id
          <input
            value={conversationId}
            onChange={(event) => setConversationId(event.target.value)}
            placeholder="Paste conversation id"
          />
        </label>
        <label className="field">
          Participants
          <input
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
          />
        </label>
        <label className="field">
          Call Type
          <select value={callType} onChange={(event) => setCallType(event.target.value)}>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
        </label>
        <div className="button-row">
          <button type="button" onClick={startCall}>
            Start Call
          </button>
          <button type="button" onClick={requestMedia}>
            Preview Media
          </button>
        </div>
      </div>

      <div className="panel__column panel__column--wide">
        <h2>Active Calls</h2>
        <div className="card-list">
          {calls.map((call) => (
            <div className="card" key={call.id}>
              <h3>{call.type.toUpperCase()} Call</h3>
              <p>Status: {call.status}</p>
              <span>Participants: {call.participants.length}</span>
            </div>
          ))}
          {calls.length === 0 && <p>No calls for this conversation.</p>}
        </div>
      </div>

      <div className="panel__column panel__column--wide">
        <h2>Local Preview</h2>
        <div className="preview">
          {localStream ? (
            <VideoPreview stream={localStream} />
          ) : (
            <p>Request media to preview audio/video.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function VideoPreview({ stream }) {
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
