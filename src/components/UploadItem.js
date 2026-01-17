import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import AWS from 'aws-sdk';

// S3 Configuration
const S3_BUCKET = process.env.REACT_APP_AWS_S3_BUCKET_NAME;
const REGION = process.env.REACT_APP_AWS_REGION;

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: REGION
});

const s3 = new AWS.S3();
const categories = ["Tops", "Bottoms", "Shoes", "Accessories", "Outerwear", "Vintage"];

const UploadItem = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) return alert("You must be logged in!");
    if (!imageFile) return alert("Please select an image!");

    setIsUploading(true);

    // 1. AWS S3 Upload Logic
    const fileName = `PKR {Date.now()}_PKR {imageFile.name}`;
    const params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: imageFile,
    //   ACL: 'public-read',
      ContentType: imageFile.type
    };

    try {
      // Use .on('httpUploadProgress') to track progress for a better UI
      const uploadRequest = s3.upload(params);
      
      uploadRequest.on('httpUploadProgress', (evt) => {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setProgress(percent);
      });

      const data = await uploadRequest.promise();
      const s3Url = data.Location;

      // 2. Save Metadata to Firestore
      await addDoc(collection(db, "listings"), {
        title,
        price: Number(price),
        category,
        imageUrl: s3Url,
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || auth.currentUser.email,
        status: 'available',
        createdAt: serverTimestamp()
      });

      alert("Listing live on GirlPower Thrift!");
      
      // Reset Form
      setTitle(''); setPrice(''); setCategory(categories[0]); setImageFile(null); setProgress(0);
      if (onUploadSuccess) onUploadSuccess(); // Close modal or switch tabs

    } catch (error) {
      console.error("Upload Error:", error);
      alert("Error: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card" style={styles.formCard}>
      <h2 style={{ color: 'var(--secondary)', marginBottom: '20px' }}>Upload New Item</h2>
      
      <form onSubmit={handleUpload} style={styles.form}>
        <div style={styles.row}>
          <input 
            type="text" 
            placeholder="Item Name" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            className="custom-input"
            style={{ flex: 2 }}
          />
          <input 
            type="number" 
            placeholder="Price (PKR )" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            required 
            className="custom-input"
            style={{ flex: 1 }}
          />
        </div>

        <select 
          className="custom-input" 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <div style={styles.fileUploadArea}>
          <label style={styles.fileLabel}>
            {imageFile ? `Selected: PKR {imageFile.name}` : "Click to select a photo"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {isUploading && (
          <div style={styles.progressContainer}>
            <div style={{ ...styles.progressBar, width: `PKR {progress}%` }}></div>
            <span style={styles.progressText}>{progress}% Uploaded</span>
          </div>
        )}

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isUploading}
          style={{ padding: '15px', fontSize: '1rem' }}
        >
          {isUploading ? "Uploading to AWS..." : "Post Listing"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  formCard: {
    maxWidth: '500px',
    margin: '40px auto',
    padding: '30px',
    borderTop: '6px solid var(--primary)'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '10px' },
  fileUploadArea: {
    border: '2px dashed #ddd',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fafafa'
  },
  fileLabel: { color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' },
  progressContainer: {
    height: '20px',
    background: '#eee',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative'
  },
  progressBar: {
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#333'
  }
};

export default UploadItem;