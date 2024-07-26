import React, { useState } from 'react';
import { solidityPackedKeccak256, keccak256 } from 'ethers';
//import { MerkleTree } from 'merkletreejs';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

const MerkleProofForm: React.FC = () => {
  const [addresses, setAddresses] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: string; content: string }>({ type: '', content: '' });

  const handleCreateMerkleProofAndDeploy = async () => {
    setIsLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // TODO: Implement Merkle proof creation logic
      const users = addresses.split('\n').map((address) => address.trim()).filter(address => address);
      
      if (users.length === 0) {
        throw new Error('Please enter at least one account address');
      }

      // Generate Merkle proof elements for merkletreejs
      // const elements = users.map((address) => 
      //   solidityPackedKeccak256(['address'], [address]));

      // Generate Merkle proof elements for OpenZeppelin
      const elements = users.map((address) => [address, rewardAmount]);


      // Create Merkle Tree with merkletreejs
      // const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
      // const root = merkleTree.getHexRoot();


      // Create Merkle Tree with OpenZeppelin
      const merkleTree = StandardMerkleTree.of(elements, ["address", "uint256"]);
      const root = merkleTree.root;



      console.log('Merkle root:', root);
      console.log('Creating Merkle proof...');
      
      // TODO: Implement contract deployment logic using ethers
      console.log('Deploying contract...');

      setMessage({ type: 'success', content: 'Merkle proof created and contract deployed successfully!' });
    } catch (error) {
      setMessage({ type: 'error', content: `Error: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Merkle Proof Generator</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Addresses (one per line)
        </label>
        <textarea
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          placeholder="0x..."
          rows={5}
          className="w-full p-2 border rounded mt-2"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reward Amount
        </label>
        <input
          type="number"
          value={rewardAmount}
          onChange={(e) => setRewardAmount(e.target.value)}
          placeholder="Enter reward amount"
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button 
        onClick={handleCreateMerkleProofAndDeploy} 
        className="w-full bg-blue-500 text-white p-2 rounded"
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Create Merkle Proof and Deploy Contract'}
      </button>

      {message.content && (
        <div className={`mt-4 p-2 rounded ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
          {message.content}
        </div>
      )}
    </div>
  );
};

export default MerkleProofForm;