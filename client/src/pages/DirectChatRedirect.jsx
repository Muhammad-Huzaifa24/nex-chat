import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useConversationStore } from '../store/conversationStore'
import { useToastStore } from '../store/toastStore'
import { Avatar } from '../components/ui/Avatar'
import api from '../services/api'
import {
  MessageSquare,
  Loader2,
  UserPlus,
  LogIn,
  ShieldCheck,
  Circle,
  ExternalLink,
} from 'lucide-react'

export const DirectChatRedirect = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { setActiveConversation, addOrUpdateConversation } = useConversationStore()
  const { addToast } = useToastStore()

  const [targetUser, setTargetUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startingChat, setStartingChat] = useState(false)

  // Fetch target user's public profile
  useEffect(() => {
    if (!username) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/users/profile/${username}`)
        if (res.data.success && res.data.user) {
          setTargetUser(res.data.user)
        } else {
          setError('User not found')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not find this user')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  // If already authenticated and not waiting for auth check, connect directly
  useEffect(() => {
    if (authLoading || loading || !targetUser) return

    if (isAuthenticated && currentUser) {
      if (currentUser.username?.toLowerCase() === username?.toLowerCase()) {
        addToast('This is your own profile link', 'info')
        navigate('/')
        return
      }

      // Automatically open direct conversation
      handleStartChat()
    }
  }, [isAuthenticated, authLoading, loading, targetUser, currentUser, username])

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('nexchat_redirect', `/u/${username}`)
      navigate('/login')
      return
    }

    setStartingChat(true)
    try {
      const res = await api.post(`/conversations/direct/user/${username}`)
      if (res.data.success && res.data.conversation) {
        const conversation = res.data.conversation
        addOrUpdateConversation(conversation)
        setActiveConversation(conversation)
        addToast(`Chat opened with ${targetUser?.displayName || username}`, 'success')
        navigate('/')
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to open chat', 'error')
      navigate('/')
    } finally {
      setStartingChat(false)
    }
  }

  const handleAuthRedirect = (path) => {
    sessionStorage.setItem('nexchat_redirect', `/u/${username}`)
    navigate(path)
  }

  if (loading || authLoading || startingChat) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-app)',
          gap: '16px',
        }}
      >
        <Loader2 size={38} className="animate-spin" color="var(--primary-color)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
          {startingChat ? `Opening chat with @${username}...` : 'Connecting to profile...'}
        </span>
      </div>
    )
  }

  if (error || !targetUser) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-app)',
          padding: '20px',
        }}
      >
        <div
          className="animate-slide-up"
          style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <MessageSquare size={30} />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', margin: '0 0 8px 0', fontWeight: 700 }}>
            User Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: '24px', lineHeight: 1.5 }}>
            The profile <strong style={{ color: 'var(--text-primary)' }}>@{username}</strong> doesn't exist on NexChat.
          </p>
          <Link
            to="/"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', padding: '12px 24px', borderRadius: 'var(--radius-md)' }}
          >
            Back to NexChat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        padding: '24px 16px',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          padding: '36px 28px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Top Brand Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 168, 132, 0.08)',
            border: '1px solid rgba(0, 168, 132, 0.2)',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '5px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={11} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            NexChat
          </span>
        </div>

        {/* Centered User Avatar */}
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 168, 132, 0.4), rgba(0, 168, 132, 0.05))',
              display: 'inline-block',
            }}
          >
            <Avatar
              src={targetUser.avatar}
              name={targetUser.displayName || targetUser.username}
              size="xl"
              isOnline={targetUser.isOnline}
            />
          </div>
        </div>

        {/* User Details */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px 0',
            letterSpacing: '-0.4px',
          }}
        >
          {targetUser.displayName}
        </h1>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--primary-color)',
              fontWeight: 600,
              backgroundColor: 'rgba(0, 168, 132, 0.1)',
              padding: '2px 10px',
              borderRadius: '999px',
            }}
          >
            @{targetUser.username}
          </span>

          <span
            style={{
              fontSize: '12px',
              color: targetUser.isOnline ? 'var(--status-online, #25d366)' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: targetUser.isOnline ? 'var(--status-online, #25d366)' : 'var(--text-muted)',
              }}
            />
            {targetUser.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Bio Quote */}
        {targetUser.bio && (
          <div
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '14px',
              padding: '12px 16px',
              border: '1px solid var(--border-color)',
              marginBottom: '26px',
            }}
          >
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                margin: 0,
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              "{targetUser.bio}"
            </p>
          </div>
        )}

        {/* Call to Actions */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isAuthenticated ? (
            <button
              onClick={handleStartChat}
              disabled={startingChat}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 168, 132, 0.3)',
              }}
            >
              {startingChat ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <MessageSquare size={18} />
                  Start Chatting
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAuthRedirect('/login')}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 168, 132, 0.3)',
                  cursor: 'pointer',
                }}
              >
                <LogIn size={18} />
                Log In to Chat
              </button>

              <button
                onClick={() => handleAuthRedirect('/register')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <UserPlus size={16} />
                New user? Create Account
              </button>
            </>
          )}
        </div>

        {/* Security badge footer */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '22px',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}
        >
          <ShieldCheck size={13} color="var(--primary-color)" />
          <span>Real-time direct messaging</span>
        </div>
      </div>
    </div>
  )
}
