import React, { useState } from 'react';
import { ethers, solidityPackedKeccak256, keccak256, ContractFactory } from 'ethers';
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

      if (!rewardAmount) {
        throw new Error('Please enter the reward amount');
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
      // Connect to the user wallet
      let signer = null;
      let provider;

      if (window.ethereum == null) {
        console.log("Metamask not instaled; using read-only defaults");
        provider = ethers.getDefaultProvider();
      } else {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      }

      // Deploy the smart contract
      const abi = [
        {
          "type": "constructor",
          "inputs": [
            { "name": "_merkleRoot", "type": "bytes32", "internalType": "bytes32" },
            { "name": "_amount", "type": "uint256", "internalType": "uint256" }
          ],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "amount",
          "inputs": [],
          "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "claim",
          "inputs": [
            { "name": "_account", "type": "address", "internalType": "address" },
            {
              "name": "_merkleProof",
              "type": "bytes32[]",
              "internalType": "bytes32[]"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "merkleRoot",
          "inputs": [],
          "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
          "stateMutability": "view"
        },
        {
          "type": "event",
          "name": "Claimed",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "indexed": false,
              "internalType": "address"
            },
            {
              "name": "amount",
              "type": "uint256",
              "indexed": false,
              "internalType": "uint256"
            }
          ],
          "anonymous": false
        }
      ];

      const bytecode = {
        "object": "0x60c0604052348015600f57600080fd5b50604051610432380380610432833981016040819052602c916039565b60809190915260a052605c565b60008060408385031215604b57600080fd5b505080516020909101519092909150565b60805160a05161039f6100936000396000818160840152818160d901526101dd015260008181604b0152610150015261039f6000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632eb4a7ab14610046578063aa8c217c1461007f578063d7aada81146100a6575b600080fd5b61006d7f000000000000000000000000000000000000000000000000000000000000000081565b60405190815260200160405180910390f35b61006d7f000000000000000000000000000000000000000000000000000000000000000081565b6100b96100b43660046102bd565b6100bb565b005b6040516bffffffffffffffffffffffff19606085901b1660208201527f0000000000000000000000000000000000000000000000000000000000000000603482015260009060540160405160208183030381529060405280519060200120905061017b8383808060200260200160405190810160405280939291908181526020018383602002808284376000920191909152507f000000000000000000000000000000000000000000000000000000000000000092508591506102329050565b6101cb5760405162461bcd60e51b815260206004820152601b60248201527f4d65726b6c65436c6173733a20496e76616c69642070726f6f662e0000000000604482015260640160405180910390fd5b604080516001600160a01b03861681527f000000000000000000000000000000000000000000000000000000000000000060208201527fd8138f8a3f377c5259ca548e70e4c2de94f129f5a11036a15b69513cba2b426a910160405180910390a150505050565b60008261023f8584610248565b14949350505050565b600081815b8451811015610283576102798286838151811061026c5761026c610353565b602002602001015161028b565b915060010161024d565b509392505050565b60008183106102a75760008281526020849052604090206102b6565b60008381526020839052604090205b9392505050565b6000806000604084860312156102d257600080fd5b83356001600160a01b03811681146102e957600080fd5b9250602084013567ffffffffffffffff81111561030557600080fd5b8401601f8101861361031657600080fd5b803567ffffffffffffffff81111561032d57600080fd5b8660208260051b840101111561034257600080fd5b939660209190910195509293505050565b634e487b7160e01b600052603260045260246000fdfea26469706673582212203bb3bd5341e5f0179099021256b77b3592ee3bb1b98be23694a4e5d11d2bb0b964736f6c634300081a0033"
      }

      const factory = new ContractFactory(abi, bytecode, signer);

      const contract = await factory.deploy(root, rewardAmount);

      console.log('Deploying contract...');
      console.log('Contract address:', contract.getAddress());
      console.log('Transaction hash:', contract.deployTransaction);

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