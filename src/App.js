import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import MarketplaceTabs from './components/MarketplaceTabs';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      {/* If no user, show Auth page. Otherwise, show the main dashboard tabs. */}
      {!user ? <Auth /> : <MarketplaceTabs user={user} />}
    </div>
  );
}

export default App;