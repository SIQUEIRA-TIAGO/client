import {
    PartialWithFieldValue,
    QueryDocumentSnapshot,
} from 'firebase/firestore';

export const firebaseGenericConverter = <T>() => ({
    toFirestore: (data: PartialWithFieldValue<T>) => data,
    fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
});
