import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase'; // Import from the file above

const DEFAULT_SECTIONS = [
    { id: 'contact', type: 'contact', title: 'Contact', visible: true },
    { id: 'vault', type: 'vault', title: 'The Vault Assets', visible: true },
    { id: 'songs', type: 'songs', title: 'Songs', visible: true },
    { id: 'videos', type: 'videos', title: 'Videos', visible: true },
    { id: 'tour', type: 'tour', title: 'Tour Dates', visible: true },
    { id: 'press', type: 'press', title: 'Press & Reviews', visible: true },
];

const BASE_EPK_DATA = {
    tagline: "New Artist Profile",
    bio: "Welcome! Describe your sound, mission, and achievements here.",
    views: 0,
    vaultUnlocks: 0,
    vaultPin: "1234",
    dailyViews: {},
    stats: { mobile: 0, desktop: 0, downloads: {}, linkClicks: {} },
    heroImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=2874&auto=format&fit=crop",
    songs: [], tour: [], videos: [], press: [], socials: [],
    vault: { techRider: "", pressPhotos: "" },
    manager: { name: "", email: "" },
    font: 'font-sans',
    colors: { background: '#050505', accent: '#3b82f6', font: '#ffffff' },
    sections: DEFAULT_SECTIONS,
    createdAt: serverTimestamp(),
};

export async function setupUserEPK(uid, displayName, email) {
    if (!db) return null; // Safety check if DB failed to load
    
    const docRef = doc(db, "bands", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        const newProfile = {
            ...BASE_EPK_DATA,
            bandName: displayName || "New Artist",
            manager: {
                name: displayName || "",
                email: email || ""
            }
        };
        await setDoc(docRef, newProfile);
        return newProfile;
    }
}