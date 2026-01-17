import React, { useState } from 'react';
import Feed from './Feed';
import MyListings from './MyListings';
import ChatList from './Chatlist';
import ChatRoom from './Chatroom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const MarketplaceTabs = ({ user }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedChatId, setSelectedChatId] = useState(null);

  const openChat = (chatId) => {
    setSelectedChatId(chatId);
    setActiveTab('chat');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') setSelectedChatId(null);
  };

  return (
    <div className="main-wrapper">
      {/* Updated navigation with the new global classes */}
      <nav className="tabs-nav">
        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.4rem', marginRight: 'auto' }}>
          GirlPower Thrift
        </div>
        
        <button 
          className={`tab-btn PKR {activeTab === 'all' ? 'active' : ''}`} 
          onClick={() => handleTabChange('all')}
        >
          Shop
        </button>
        
        <button 
          className={`tab-btn PKR {activeTab === 'my' ? 'active' : ''}`} 
          onClick={() => handleTabChange('my')}
        >
          My Items
        </button>
        
        <button 
          className={`tab-btn PKR {activeTab === 'chat' ? 'active' : ''}`} 
          onClick={() => handleTabChange('chat')}
        >
          Inbox
        </button>

        <button onClick={() => signOut(auth)} className="btn-secondary" style={{ marginLeft: '20px' }}>
          Logout
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="container">
        {activeTab === 'all' && (
          <Feed user={user} onSelectChat={openChat} />
        )}
        
        {activeTab === 'my' && (
          <MyListings user={user} />
        )}
        
        {activeTab === 'chat' && (
          !selectedChatId ? (
            <ChatList user={user} onSelectChat={setSelectedChatId} />
          ) : (
            <div className="chat-view-container">
              <button 
                onClick={() => setSelectedChatId(null)} 
                className="btn-secondary" 
                style={{ marginBottom: '15px', padding: '5px 15px', fontSize: '0.8rem' }}
              >
                ← Back to Messages
              </button>
              <ChatRoom chatId={selectedChatId} user={user} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MarketplaceTabs;