// Color palette
export const COLORS = {
  teal: '#88B9B0',
  pink: '#E6B89C',
  rose: '#9C7178',
  cream: '#F4F1EA',
  charcoal: '#4A4A4A'
};

// Collection types for dropdown
export const COLLECTION_TYPES = [
  { value: "all", label: "All Photos" },
  { value: "nature", label: "Nature" },
  { value: "travels", label: "Travels" },
  { value: "favorites", label: "Favorites" },
];

// Stock photos for watercolor textures and backgrounds
export const STOCK_IMAGES = {
  watercolor: [
    'https://images.unsplash.com/photo-1580106285538-132e4d39e035',
    'https://images.unsplash.com/photo-1517056338492-99899a9fccf0',
    'https://images.unsplash.com/photo-1613928317813-448b53f5a3f3'
  ],
  landscapes: [
    'https://images.unsplash.com/photo-1490604001847-b712b0c2f967',
    'https://images.unsplash.com/photo-1578146165056-6e03aaae7ff5',
    'https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875',
    'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe',
    'https://images.unsplash.com/photo-1627483262769-04d0a1401487',
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742'
  ],
  nature: [
    'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e',
    'https://images.unsplash.com/photo-1627483262769-04d0a1401487',
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742',
    'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe'
  ]
};

export const API_ENDPOINTS = {
  photos: '/api/photos',
  collections: '/api/collections',
  collectionsWithThumbnails: '/api/collections/with-thumbnails',
  photo: (id: string | number) => `/api/photos/${id}`,
  collection: (id: string | number) => `/api/collections/${id}`,
  likePhoto: (id: string | number) => `/api/photos/${id}/like`,
  photosByCollection: (collectionId: string | number) => `/api/photos?collectionId=${collectionId}`,
  collectionPhotos: (collectionId: string | number) => `/api/photos?collectionId=${collectionId}`,
  photoComments: (photoId: string | number) => `/api/photos/${photoId}/comments`,
  comment: (id: string | number) => `/api/comments/${id}`,
  image: (fileName: string) => `/api/images/${fileName}`
};

// Format date in a human-readable way
export const formatDate = (date: string | Date | null) => {
  if (!date) {
    date = new Date();
  }
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};
