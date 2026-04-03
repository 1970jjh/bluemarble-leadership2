import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  increment,
  Firestore,
} from 'firebase/firestore';
import { Session } from '../types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Initialize Firebase only if config values exist
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase is not initialized. Check your environment variables.');
  }
  return db;
}

// ============================================================
// Sessions Collection
// ============================================================

export function subscribeToAllSessions(callback: (sessions: Session[]) => void): () => void {
  const sessionsRef = collection(getDb(), 'sessions');
  return onSnapshot(sessionsRef, (snapshot) => {
    const sessions: Session[] = snapshot.docs.map((doc) => doc.data() as Session);
    callback(sessions);
  });
}

export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): () => void {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  return onSnapshot(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Session);
    } else {
      callback(null);
    }
  });
}

export function subscribeToGameState(
  sessionId: string,
  callback: (state: any) => void
): () => void {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  return onSnapshot(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
}

export async function createSession(session: Session): Promise<void> {
  const sessionRef = doc(getDb(), 'sessions', session.id);
  await setDoc(sessionRef, session);
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  const snapshot = await getDoc(sessionRef);
  if (snapshot.exists()) {
    return snapshot.data() as Session;
  }
  return null;
}

export async function getSessionByAccessCode(accessCode: string): Promise<Session | null> {
  const sessionsRef = collection(getDb(), 'sessions');
  const q = query(sessionsRef, where('accessCode', '==', accessCode));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as Session;
  }
  return null;
}

export async function updateSession(sessionId: string, data: any): Promise<void> {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  await updateDoc(sessionRef, data);
}

export async function updateSessionStatus(sessionId: string, status: string): Promise<void> {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  await updateDoc(sessionRef, { status });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  await deleteDoc(sessionRef);
  // Also clean up the associated game state
  try {
    const stateRef = doc(getDb(), 'gameStates', sessionId);
    await deleteDoc(stateRef);
  } catch (e) {
    console.warn('No game state to delete for session', sessionId);
  }
}

export async function updateTeams(sessionId: string, teams: any[]): Promise<void> {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  await updateDoc(sessionRef, { teams });
}

// ============================================================
// Game States Collection
// ============================================================

export async function updateGameState(sessionId: string, state: any): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  await setDoc(stateRef, state, { merge: true });
}

export async function addGameLog(sessionId: string, logEntry: string): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  await updateDoc(stateRef, {
    gameLogs: arrayUnion(logEntry),
  });
}

// ============================================================
// Simultaneous Response System
// ============================================================

export async function updateTeamResponse(
  sessionId: string,
  teamId: string,
  response: any
): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  await updateDoc(stateRef, {
    [`teamResponses.${teamId}`]: response,
  });
}

export async function setResponsesRevealed(
  sessionId: string,
  revealed: boolean
): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  await updateDoc(stateRef, {
    isRevealed: revealed,
  });
}

export async function resetTeamResponses(sessionId: string): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  await updateDoc(stateRef, {
    teamResponses: {},
    isRevealed: false,
    aiAnalysisResult: null,
    isAnalyzing: false,
  });
}

export async function saveAIComparativeResult(
  sessionId: string,
  result: any
): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);
  await updateDoc(stateRef, {
    aiAnalysisResult: result,
    isAnalyzing: false,
  });
}

// ============================================================
// Territory System
// ============================================================

export async function updateTerritoryOwnership(
  sessionId: string,
  squareIndex: number,
  teamId: string,
  teamName: string,
  teamColor: string
): Promise<void> {
  const sessionRef = doc(getDb(), 'sessions', sessionId);
  // We store territories as a map keyed by square index for easy updates
  await updateDoc(sessionRef, {
    [`territories.${squareIndex}`]: {
      squareIndex,
      ownerTeamId: teamId,
      ownerTeamName: teamName,
      ownerTeamColor: teamColor,
      acquiredAt: Date.now(),
    },
  });
}

// ============================================================
// Spectator Voting
// ============================================================

export async function updateSpectatorVote(
  sessionId: string,
  choiceId: string,
  previousVoteId: string | null,
  voterTeamName: string
): Promise<void> {
  const stateRef = doc(getDb(), 'gameStates', sessionId);

  if (previousVoteId) {
    // Remove the previous vote by decrementing, then add new vote
    await updateDoc(stateRef, {
      [`spectatorVotes.${previousVoteId}`]: increment(-1),
      [`spectatorVotes.${choiceId}`]: increment(1),
      [`spectatorVoters.${voterTeamName}`]: choiceId,
    });
  } else {
    await updateDoc(stateRef, {
      [`spectatorVotes.${choiceId}`]: increment(1),
      [`spectatorVoters.${voterTeamName}`]: choiceId,
    });
  }
}
