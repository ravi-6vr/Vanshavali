import { useState, useEffect, useRef, useCallback } from 'react';

export default function PhotoGallery({ memberId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [caption, setCaption] = useState('');
  const [dateTaken, setDateTaken] = useState('');
  const fileRef = useRef(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/photos/${memberId}`);
      const data = await res.json();
      setPhotos(data);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;
        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId, imageData, caption, dateTaken }),
        });
        setCaption('');
        setDateTaken('');
        await fetchPhotos();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    if (lightbox?.id === photoId) setLightbox(null);
  };

  if (loading) {
    return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div>
      {/* Upload section */}
      <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <p className="text-sm font-medium text-stone-700 mb-3">Add Photo</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Caption</label>
            <input className="input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Optional caption..." />
          </div>
          <div>
            <label className="label">Date Taken</label>
            <input type="date" className="input" value={dateTaken} onChange={e => setDateTaken(e.target.value)} />
          </div>
          <div className="flex items-end">
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`photo-${memberId}`} />
              <label htmlFor={`photo-${memberId}`} className="btn btn-primary cursor-pointer">
                {uploading ? 'Uploading...' : 'Choose & Upload'}
              </label>
              <p className="text-[10px] text-stone-400 mt-1">Max 5MB, JPG/PNG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-stone-400 text-sm">No photos yet. Upload the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div
                className="aspect-square cursor-pointer overflow-hidden bg-stone-100"
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={`/api/photos/file/${photo.filename}`}
                  alt={photo.caption || 'Family photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                {photo.caption && <p className="text-sm text-stone-700 font-medium">{photo.caption}</p>}
                {photo.date_taken && <p className="text-xs text-stone-400">{new Date(photo.date_taken).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <div className="max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <img
              src={`/api/photos/file/${lightbox.filename}`}
              alt={lightbox.caption || 'Photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {lightbox.caption && (
              <p className="text-center text-white text-sm mt-3">{lightbox.caption}</p>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
