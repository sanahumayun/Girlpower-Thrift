import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import AWS from 'aws-sdk';

// 1. AWS S3 Configuration from your .env file
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});

const s3 = new AWS.S3();
const categories = ["Tops", "Bottoms", "Shoes", "Accessories", "Outerwear", "Vintage"];

const MyListings = ({ user }) => {
  const [myListings, setMyListings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "listings"), where("sellerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image to upload!");

    setUploading(true);

    // 2. AWS S3 Upload Logic
    const fileName = `PKR {Date.now()}_PKR {imageFile.name}`;
    const params = {
      Bucket: process.env.REACT_APP_AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: imageFile,
    //   ACL: 'public-read', // Ensure your bucket policy allows this
      ContentType: imageFile.type
    };

    try {
      const upload = await s3.upload(params).promise();
      const s3ImageUrl = upload.Location;

      // 3. Save to Firebase with S3 URL
      await addDoc(collection(db, "listings"), {
        title,
        price: Number(price),
        category,
        imageUrl: s3ImageUrl,
        sellerId: user.uid,
        sellerName: user.displayName || user.email,
        status: 'available',
        createdAt: serverTimestamp()
      });

      // Reset form
      setTitle(''); setPrice(''); setImageFile(null);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      await deleteDoc(doc(db, "listings", id));
    }
  };

  return (
    <div className="container">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--secondary)' }}>My Shop</h2>
          <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>Manage your listings.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
          {showAddForm ? 'Cancel' : '+ New Listing'}
        </button>
      </div>

      {showAddForm && (
        <div style={localStyles.formCard}>
          <h3 style={{ marginTop: 0 }}>Create Listing</h3>
          <form onSubmit={handleAddListing} style={localStyles.form}>
            <div style={localStyles.inputGroup}>
              <input placeholder="Item Name" value={title} onChange={e => setTitle(e.target.value)} required className="custom-input" />
              <input placeholder="Price (PKR )" type="number" value={price} onChange={e => setPrice(e.target.value)} required className="custom-input" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="custom-input">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            
            {/* 5. File Input for Image */}
            <label style={{ fontSize: '0.8rem', color: '#666' }}>Upload Item Photo:</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => setImageFile(e.target.files[0])} 
              className="custom-input" 
              required 
            />
            
            <button type="submit" className="btn-secondary" disabled={uploading}>
              {uploading ? 'Uploading to AWS...' : 'Publish to Shop'}
            </button>
          </form>
        </div>
      )}

      <div className="grid-3">
        {myListings.map(item => (
          <ListingItem key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};

const ListingItem = ({ item, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editPrice, setEditPrice] = useState(item.price);

  const isSold = item.status === 'sold';

  const handleUpdate = async () => {
    const itemRef = doc(db, "listings", item.id);
    try {
      await updateDoc(itemRef, {
        title: editTitle,
        price: Number(editPrice)
      });
      setIsEditing(false);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };
  
  const handleToggleStatus = async () => {
    const itemRef = doc(db, "listings", item.id);
    const newStatus = isSold ? 'available' : 'sold';
    try {
      await updateDoc(itemRef, { status: newStatus });
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  return (
    <div className="card" style={{ opacity: isSold ? 0.7 : 1, overflow: 'visible' }}>
      <div style={{ position: 'relative' }}>
        <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '15px 15px 0 0' }} />
        <div style={localStyles.categoryBadge}>{item.category || "General"}</div>
        {isSold && <div style={localStyles.soldStamp}>SOLD</div>}
      </div>
      
      <div style={{ padding: '20px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input className="custom-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <input className="custom-input" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={handleUpdate} className="btn-primary" style={{ flex: 1, padding: '5px' }}>Save</button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ flex: 1, padding: '5px' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{item.title}</h3>
            <p style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '15px' }}>PKR {item.price}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>Edit</button>
                <button onClick={() => onDelete(item.id)} className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', background: '#ff4d4d' }}>Delete</button>
              </div>
              <button onClick={handleToggleStatus} className="btn-primary" style={{ background: isSold ? '#666' : 'var(--accent)', fontSize: '0.8rem', border: 'none' }}>
                {isSold ? 'Mark as Unsold' : 'Mark as Sold'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const localStyles = {
  summaryBanner: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    background: 'var(--secondary)',
    padding: '20px',
    borderRadius: '15px',
    color: 'white'
  },
  summaryItem: { display: 'flex', flexDirection: 'column' },
  summaryLabel: { fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' },
  summaryValue: { fontSize: '1.5rem', fontWeight: 'bold' },
  formCard: { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '5px solid var(--primary)' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputGroup: { display: 'flex', gap: '12px' },
  categoryBadge: { position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--secondary)', zIndex: 2 },
  soldStamp: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', background: 'rgba(255, 77, 77, 0.9)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontWeight: '900', fontSize: '1.5rem', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 3, pointerEvents: 'none' }
};

export default MyListings;