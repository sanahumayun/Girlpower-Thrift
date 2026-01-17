import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Auth = () => {
  // No more useNavigate needed here!

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Once this succeeds, App.js will see the user and switch views automatically
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
      alert("Failed to sign in. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Thrift Marketplace</h2>
        <p>Sign in to start buying and selling</p>
        <button onClick={handleSignIn} style={styles.button}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '80vh' 
  },
  card: { 
    padding: '40px', 
    border: '1px solid #ddd', 
    borderRadius: '12px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  button: { 
    padding: '12px 24px', 
    fontSize: '16px', 
    backgroundColor: '#4285F4', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    marginTop: '20px'
  }
};

export default Auth;