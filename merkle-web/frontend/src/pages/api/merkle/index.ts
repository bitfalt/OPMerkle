import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { contractAddress, merkleTree } = await request.json();

        if (!contractAddress || !merkleTree) {
            return new Response("Missing required fields", { status: 400 });
        }

        const db = getFirestore(app);
        const contractRef = db.collection("contracts");
        await contractRef.doc(contractAddress).set({ merkleTree });

        return new Response("Merkle tree saved", { status: 200 });

    } catch (error) {
        return new Response("Internal server error", { status: 500 });
    }
};