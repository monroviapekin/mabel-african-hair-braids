
import React from 'react';

function App() {
  // Your 20 numbered braids
  const braidsImages = Array.from({ length: 20 }, (_, i) => `braids${i + 1}.jpg`);
  
  // Your 3 special images
  const specialImages = ['cornrow.jpg', 'thread.jpg', 'mabel100.jpg'];
  
  // Combine all
  const allImages = [...braidsImages, ...specialImages];

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#8B4513', marginBottom: '10px' }}>Mabel African Braids</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>Professional Braiding in Fargo, ND</p>
      </header>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '0 10px'
      }}>
        {allImages.map((img, index) => {
          // Create nice labels
          let label = `Style ${index + 1}`;
          if (img === 'cornrow.jpg') label = 'Cornrows';
          if (img === 'thread.jpg') label = 'Threading';
          if (img === 'mabel100.jpg') label = 'Mabel's Work';
          if (img.startsWith('braids')) label = `Braids ${img.replace('braids','').replace('.jpg','')}`;
          
          return (
            <div key={index} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <img 
                src={`/images/${img}`} 
                alt={label}
                style={{ 
                  width: '100%', 
                  height: '280px', 
                  objectFit: 'cover',
                  display: 'block'
                }} 
                onError={(e) => {
                  // Hide broken images
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <p style={{ padding: '12px', margin: 0, fontWeight: '500' }}>{label}</p>
            </div>
          );
        })}
      </div>
      
      <footer style={{ marginTop: '50px', padding: '20px', borderTop: '1px solid #ddd' }}>
        <h3>Book Your Appointment</h3>
        <p style={{ fontSize: '18px' }}>📞 (701) 219-8120</p>
        <p>📍 Fargo, North Dakota</p>
        <p style={{ color: '#888', fontSize: '14px', marginTop: '20px' }}>© 2026 Mabel African Braids</p>
      </footer>
    </div>
  );
}

export default App;
