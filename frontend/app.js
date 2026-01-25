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
  const [userId, setUserId] = useState('user-1');
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [conversationId, setConversationId] = useState('');
  const [participants, setParticipants] = useState('user-1,user-2');
  const [callType, setCallType] = useState('video');
  const [calls, setCalls] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState('');
  const [role, setRole] = useState('caller');
  const [statusMessage, setStatusMessage] = useState('Idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pollerRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const processedSignalsRef = useRef(new Set());

  const selectedCall = useMemo(
    () => calls.find((call) => call.id === selectedCallId) ?? null,
    [calls, selectedCallId],
  );

  const parsedParticipants = useMemo(
    () =>
      participants
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [participants],
  );

  const startPollingCalls = () => {
    if (!conversationId) {
      return;
    }

    const load = () => {
      fetch(`${apiBaseUrl}/calls/conversation/${conversationId}`)
        .then((res) => res.json())
        .then((data) => setCalls(Array.isArray(data) ? data : []))
        .catch(() => setCalls([]));
    };

    load();
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
    }
    pollerRef.current = setInterval(load, 3000);
  };

  useEffect(() => {
    startPollingCalls();
    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    return () => {
      teardownConnection();
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
      }
    };
  }, []);

  const resetSignals = (callId) => {
    for (const key of Array.from(processedSignalsRef.current)) {
      if (key.startsWith(`${callId}:`)) {
        processedSignalsRef.current.delete(key);
      }
    }
  };

  const startCall = () => {
    if (!conversationId || parsedParticipants.length === 0) {
      setErrorMessage('Provide a conversation id and at least one participant.');
      return;
    }

    setErrorMessage('');
    const payload = {
      conversationId,
      type: callType,
      participants: parsedParticipants.map((id) => ({
        userId: id,
        displayName: id === userId ? displayName : id,
      })),
    };

    fetch(`${apiBaseUrl}/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setCalls((prev) => [data, ...prev.filter((entry) => entry.id !== data.id)]);
        setSelectedCallId(data.id);
        resetSignals(data.id);
        setStatusMessage('Call created. You can now connect.');
      })
      .catch(() => setErrorMessage('Unable to start a call.'));
  };

  const updateCallStatus = (callId, status) =>
    fetch(`${apiBaseUrl}/calls/${callId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setCalls((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
        return updated;
      });

  const attachRemoteTrack = (track) => {
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
      setRemoteStream(remoteStreamRef.current);
    }
    remoteStreamRef.current.addTrack(track);
    setRemoteStream(remoteStreamRef.current);
  };

  const ensureLocalStream = async (type) => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const teardownConnection = () => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    remoteStreamRef.current = null;
    setRemoteStream(null);
  };

  const createPeerConnection = (call) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      fetch(`${apiBaseUrl}/calls/${call.id}/signals/ice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, payload: event.candidate }),
      }).catch(() => {
        setErrorMessage('Failed to publish ICE candidate.');
      });
    };

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach(attachRemoteTrack);
      if (event.streams[0] && event.streams[0].getTracks().length === 0) {
        attachRemoteTrack(event.track);
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const connectToCall = async () => {
    if (!selectedCall) {
      setErrorMessage('Select a call before connecting.');
      return;
    }

    setErrorMessage('');
    setIsConnecting(true);
    setStatusMessage('Preparing media...');
    teardownConnection();
    resetSignals(selectedCall.id);

    try {
      const stream = await ensureLocalStream(selectedCall.type);
      const peer = createPeerConnection(selectedCall);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      if (role === 'caller') {
        setStatusMessage('Creating offer...');
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await fetch(`${apiBaseUrl}/calls/${selectedCall.id}/signals/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: userId, payload: offer }),
        });
        await updateCallStatus(selectedCall.id, 'in_progress');
        setStatusMessage('Offer sent. Waiting for answer...');
      } else {
        setStatusMessage('Waiting for an offer...');
      }
    } catch (error) {
      teardownConnection();
      setErrorMessage('Unable to access camera/microphone.');
      setStatusMessage('Connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const signalKey = (callId, type, signal) =>
    `${callId}:${type}:${signal.senderId}:${JSON.stringify(signal.payload)}`;

  const applyOffer = async (call, signal) => {
    if (!peerRef.current) {
      const stream = await ensureLocalStream(call.type);
      const peer = createPeerConnection(call);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    const peer = peerRef.current;
    if (!peer) {
      return;
    }

    await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await fetch(`${apiBaseUrl}/calls/${call.id}/signals/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: userId, payload: answer }),
    });
    await updateCallStatus(call.id, 'in_progress');
    setStatusMessage('Answer sent. Connecting...');
  };

  const applyAnswer = async (signal) => {
    const peer = peerRef.current;
    if (!peer || peer.signalingState === 'stable') {
      return;
    }
    await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
    setStatusMessage('Answer received. Establishing media...');
  };

  const applyIceCandidate = async (signal) => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) {
      return;
    }
    await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
  };

  useEffect(() => {
    if (!selectedCallId) {
      return;
    }

    let disposed = false;

    const pollSignals = async () => {
      const call = calls.find((entry) => entry.id === selectedCallId);
      if (!call) {
        return;
      }

      const [offers, answers, iceCandidates] = await Promise.all([
        fetch(`${apiBaseUrl}/calls/${call.id}/signals/offer`).then((res) => res.json()),
        fetch(`${apiBaseUrl}/calls/${call.id}/signals/answer`).then((res) => res.json()),
        fetch(`${apiBaseUrl}/calls/${call.id}/signals/ice`).then((res) => res.json()),
      ]);

      if (disposed) {
        return;
      }

      const unseenOffers = (offers || []).filter((signal) => {
        if (signal.senderId === userId) {
          return false;
        }
        const key = signalKey(call.id, 'offer', signal);
        if (processedSignalsRef.current.has(key)) {
          return false;
        }
        processedSignalsRef.current.add(key);
        return true;
      });

      const unseenAnswers = (answers || []).filter((signal) => {
        if (signal.senderId === userId) {
          return false;
        }
        const key = signalKey(call.id, 'answer', signal);
        if (processedSignalsRef.current.has(key)) {
          return false;
        }
        processedSignalsRef.current.add(key);
        return true;
      });

      const unseenIce = (iceCandidates || []).filter((signal) => {
        if (signal.senderId === userId) {
          return false;
        }
        const key = signalKey(call.id, 'ice', signal);
        if (processedSignalsRef.current.has(key)) {
          return false;
        }
        processedSignalsRef.current.add(key);
        return true;
      });

      for (const offer of unseenOffers) {
        if (role === 'callee') {
          await applyOffer(call, offer);
        }
      }

      for (const answer of unseenAnswers) {
        if (role === 'caller') {
          await applyAnswer(answer);
        }
      }

      for (const candidate of unseenIce) {
        await applyIceCandidate(candidate);
      }
    };

    const interval = setInterval(() => {
      pollSignals().catch(() => {
        setErrorMessage('Failed to poll call signals.');
      });
    }, 1500);

    pollSignals().catch(() => {
      setErrorMessage('Failed to poll call signals.');
    });

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [calls, role, selectedCallId, userId]);

  const endCall = async () => {
    if (!selectedCall) {
      return;
    }
    teardownConnection();
    await updateCallStatus(selectedCall.id, 'ended');
    setStatusMessage('Call ended.');
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
          Participants (comma separated)
          <input value={participants} onChange={(event) => setParticipants(event.target.value)} />
        </label>
        <label className="field">
          Call Type
          <select value={callType} onChange={(event) => setCallType(event.target.value)}>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
        </label>
        <label className="field">
          Role
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="caller">Caller / Initiator</option>
            <option value="callee">Callee / Joiner</option>
          </select>
        </label>
        <div className="button-row">
          <button type="button" onClick={startCall}>
            Create Call
          </button>
          <button type="button" onClick={connectToCall} disabled={isConnecting}>
            {role === 'caller' ? 'Connect as Caller' : 'Join as Callee'}
          </button>
        </div>
        <div className="button-row">
          <button type="button" className="button--ghost" onClick={endCall}>
            End Call
          </button>
        </div>
        <div className="status">
          <strong>Status:</strong> {statusMessage}
        </div>
        {errorMessage && <div className="status status--error">{errorMessage}</div>}
        {selectedCall && (
          <div className="status status--info">
            Selected call: <strong>{selectedCall.id}</strong>
          </div>
        )}
      </div>

      <div className="panel__column panel__column--wide">
        <h2>Calls</h2>
        <p className="hint">Calls refresh every few seconds for the selected conversation.</p>
        <div className="card-list">
          {calls.map((call) => (
            <button
              key={call.id}
              type="button"
              className={selectedCallId === call.id ? 'card card--active card--interactive' : 'card card--interactive'}
              onClick={() => {
                setSelectedCallId(call.id);
                resetSignals(call.id);
                setStatusMessage('Call selected. Connect when ready.');
              }}
            >
              <div className="card__title-row">
                <h3>{call.type.toUpperCase()} Call</h3>
                <span className={`badge badge--${call.status}`}>{call.status.replace('_', ' ')}</span>
              </div>
              <p className="call-meta">Started: {new Date(call.startedAt).toLocaleString()}</p>
              <p className="call-meta">Participants: {call.participants.map((p) => p.displayName).join(', ')}</p>
              <p className="call-meta">Call Id: {call.id}</p>
            </button>
          ))}
          {calls.length === 0 && <p>No calls for this conversation yet.</p>}
        </div>
      </div>

      <div className="panel__column panel__column--wide">
        <h2>Live Session</h2>
        <div className="media-grid">
          <div className="media-card">
            <h3>Local</h3>
            {localStream ? (
              <VideoPreview stream={localStream} muted />
            ) : (
              <p className="media-placeholder">Connect to preview your media.</p>
            )}
          </div>
          <div className="media-card">
            <h3>Remote</h3>
            {remoteStream ? (
              <VideoPreview stream={remoteStream} />
            ) : (
              <p className="media-placeholder">Waiting for the other participant.</p>
            )}
          </div>
        </div>
        <p className="hint">
          Use two browser tabs: start as caller in one tab, then switch role to callee in the other tab and join the same call.
        </p>
      </div>
    </section>
  );
}

function VideoPreview({ stream, muted = false }) {
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} />;
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
