import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

// SET YOUR COMMUNITY SECRETS HERE
const COMMUNITY_CONFIG = {
  question1: "Who is the most paid person at LUMS?",
  answer1: "VC", // Change this to your preset answer
  question2: "What is the dining centre called (abbreviation)?",
  answer2: "PDC"     // Change this to your preset answer
};

const Auth = ({ setUser }) => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // User input states
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      if (isRegistering) {
        // 1. PRE-SET ANSWER VALIDATION
        // We check if the input matches (case-insensitive)
        if (input1.trim().toLowerCase() !== COMMUNITY_CONFIG.answer1.toLowerCase() || 
            input2.trim().toLowerCase() !== COMMUNITY_CONFIG.answer2.toLowerCase()) {
          setError("Access Denied: Your answers do not match our community records.");
          return;
        }

        // 2. CREATE AUTH ACCOUNT
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. SAVE PROFILE TO FIRESTORE
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          communityVerified: true,
          createdAt: new Date()
        });

        // Inside handleAuth after userCredential is created:
        await updateProfile(userCredential.user, {
        displayName: name
        });

      } else {
        // Simple Login
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="card" style={styles.authCard}>
      <h2 style={{ color: 'var(--primary)', textAlign: 'center' }}>
        {isRegistering ? "Registration" : "Welcome Back"}
      </h2>
      
      {error && <p style={styles.errorText}>{error}</p>}

      <form onSubmit={handleAuth} style={styles.form}>
        {isRegistering && (
          <>
            <input placeholder="Full Name" className="custom-input" onChange={(e) => setName(e.target.value)} required />
            
            <div style={styles.questionBox}>
              <label style={styles.label}>{COMMUNITY_CONFIG.question1}</label>
              <input 
                placeholder="Your answer..." 
                className="custom-input" 
                onChange={(e) => setInput1(e.target.value)} 
                required 
              />
            </div>

            <div style={styles.questionBox}>
              <label style={styles.label}>{COMMUNITY_CONFIG.question2}</label>
              <input 
                placeholder="Your answer..." 
                className="custom-input" 
                onChange={(e) => setInput2(e.target.value)} 
                required 
              />
            </div>
          </>
        )}
        
        <input type="email" placeholder="Email" className="custom-input" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="custom-input" onChange={(e) => setPassword(e.target.value)} required />
        
        <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
          {isRegistering ? "Create Account" : "Login"}
        </button>
      </form>

      <p onClick={() => setIsRegistering(!isRegistering)} style={styles.toggleText}>
        {isRegistering ? "Already a member? Login" : "New here? Join the community"}
      </p>
    </div>
  );
};

const styles = {
  authCard: { maxWidth: '450px', margin: '60px auto', padding: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  questionBox: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.85rem', color: '#555', fontWeight: 'bold' },
  errorText: { color: '#ff4d4d', background: '#fff0f0', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' },
  toggleText: { textAlign: 'center', cursor: 'pointer', marginTop: '20px', color: 'var(--primary)', fontWeight: 'bold' }
};

export default Auth;