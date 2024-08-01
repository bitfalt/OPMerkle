import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";

export const GET: APIRoute = async ({ params }) => {
  
    const contractAddress = params.contractAddress;
  
    if (!contractAddress) {
      return new Response(JSON.stringify({ message: "Missing contract address" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    try {
        const db = getFirestore(app);
        const contractRef = db.collection("contracts").doc(contractAddress);
        const doc = await contractRef.get();
  
      if (!doc.exists) {
        return new Response(JSON.stringify({ message: "Contract not found" }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      const data = doc.data();
  
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };