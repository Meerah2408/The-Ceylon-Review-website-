import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { Article, Writer } from './types';
import { INITIAL_ARTICLES, INITIAL_WRITERS } from './initialData';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('The client is currently offline. Using local cached editorial state.');
    }
  }
}
testConnection();

// Google Sign-In for Sovereign Editorial Authority
export async function signInEditorWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function signOutEditor(): Promise<void> {
  await signOut(auth);
}

// Real-time Firestore Subscriptions
export function subscribeToArticles(
  onData: (articles: Article[]) => void,
  onError?: (err: Error) => void
) {
  const articlesPath = 'articles';
  return onSnapshot(
    collection(db, articlesPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Article[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as Article);
        });
        onData(loaded);
      } else {
        // Return empty so caller can seed if desired
        onData([]);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, articlesPath);
    }
  );
}

export function subscribeToWriters(
  onData: (writers: Writer[]) => void,
  onError?: (err: Error) => void
) {
  const writersPath = 'writers';
  return onSnapshot(
    collection(db, writersPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Writer[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as Writer);
        });
        onData(loaded);
      } else {
        onData([]);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, writersPath);
    }
  );
}

// Mutations
export async function saveArticleToFirestore(article: Article): Promise<void> {
  const path = `articles/${article.id}`;
  try {
    await setDoc(doc(db, 'articles', article.id), article);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateArticleInFirestore(articleId: string, fields: Partial<Article>): Promise<void> {
  const path = `articles/${articleId}`;
  try {
    await updateDoc(doc(db, 'articles', articleId), fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  const path = `articles/${articleId}`;
  try {
    await deleteDoc(doc(db, 'articles', articleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveWriterToFirestore(writer: Writer): Promise<void> {
  const path = `writers/${writer.id}`;
  try {
    await setDoc(doc(db, 'writers', writer.id), writer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Seed initial archives if Firestore is empty
export async function seedInitialFirestoreArchives(): Promise<void> {
  try {
    const existingSnap = await getDocs(query(collection(db, 'articles')));
    if (existingSnap.empty) {
      for (const art of INITIAL_ARTICLES) {
        await setDoc(doc(db, 'articles', art.id), art);
      }
    }
    const writersSnap = await getDocs(query(collection(db, 'writers')));
    if (writersSnap.empty) {
      for (const w of INITIAL_WRITERS) {
        await setDoc(doc(db, 'writers', w.id), w);
      }
    }
  } catch (error) {
    console.warn('Initial seeding could not complete (might require editorial auth):', error);
  }
}
