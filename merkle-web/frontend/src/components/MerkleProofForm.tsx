import React, { useState } from 'react';
import { ethers, ContractFactory, parseEther, formatEther } from 'ethers';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

const MerkleProofForm: React.FC = () => {
  const [addresses, setAddresses] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: string; content: string }>({ type: '', content: '' });

  const saveMerkleTree = async (merkleTree: any, contractAddress: string) => {

    try {
      const response = await fetch('/api/merkle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({contractAddress, merkleTree})
      });
  
      if (response.ok) {
        console.log('Success', response.body);
      } else {
        console.error('Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
  };

  const handleCreateMerkleProofAndDeploy = async () => {
    setIsLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const users = addresses.split('\n').map((address) => address.trim()).filter(address => address);
      
      if (users.length === 0) {
        throw new Error('Please enter at least one account address');
      }

      if (!rewardAmount) {
        throw new Error('Please enter the reward amount');
      }

      const rewardAmountWeiString = String(parseEther(rewardAmount));
      const rewardAmountWei = parseEther(rewardAmount);

      // Generate Merkle proof elements for OpenZeppelin
      const elements = users.map((address) => [address, rewardAmountWeiString]);

      console.log("Total wallets: ", elements.length);

      const amountDeposit = rewardAmountWei * BigInt(elements.length);

      console.log("Amount to deposit: ", formatEther(amountDeposit));

      // Create Merkle Tree with OpenZeppelin
      const merkleTree = StandardMerkleTree.of(elements, ["address", "uint256"]);
      const root = merkleTree.root;

      // Save the Merkle tree to Firestore
      console.log('Merkle root:', root);
      
      const merkleTreeData = merkleTree.dump();

      console.log('Merkle tree data:', merkleTreeData);

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
          "name": "deposit",
          "inputs": [],
          "outputs": [],
          "stateMutability": "payable"
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
        },
        {
          "type": "event",
          "name": "Received",
          "inputs": [
            {
              "name": "sender",
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
        "object": "0x60c0604052348015600f57600080fd5b506040516105d43803806105d4833981016040819052602c916039565b60809190915260a052605c565b60008060408385031215604b57600080fd5b505080516020909101519092909150565b60805160a0516105326100a260003960008181609c015281816101370152818161022f0152818161029b01526103240152600081816056015261019e01526105326000f3fe60806040526004361061003f5760003560e01c80632eb4a7ab14610044578063aa8c217c1461008a578063d0e30db0146100be578063d7aada81146100c8575b600080fd5b34801561005057600080fd5b506100787f000000000000000000000000000000000000000000000000000000000000000081565b60405190815260200160405180910390f35b34801561009657600080fd5b506100787f000000000000000000000000000000000000000000000000000000000000000081565b6100c66100e8565b005b3480156100d457600080fd5b506100c66100e33660046103f8565b610122565b604080513381523460208201527f88a5966d370b9919b20f3e2c13ff65706f196a4e32cc2c12bf57088f88525874910160405180910390a1565b604080516001600160a01b03841660208201527f00000000000000000000000000000000000000000000000000000000000000009181019190915260009060600160408051601f19818403018152828252805160209182012090830152016040516020818303038152906040528051906020012090506101c3827f000000000000000000000000000000000000000000000000000000000000000083610283565b6102145760405162461bcd60e51b815260206004820152601b60248201527f4d65726b6c65436c6173733a20496e76616c69642070726f6f662e000000000060448201526064015b60405180910390fd5b61021d83610299565b604080516001600160a01b03851681527f000000000000000000000000000000000000000000000000000000000000000060208201527fd8138f8a3f377c5259ca548e70e4c2de94f129f5a11036a15b69513cba2b426a910160405180910390a1505050565b600082610290858461036d565b14949350505050565b7f00000000000000000000000000000000000000000000000000000000000000004710156103145760405162461bcd60e51b815260206004820152602260248201527f4d65726b6c65436c6173733a20496e73756666696369656e742062616c616e63604482015261329760f11b606482015260840161020b565b6040516001600160a01b038216907f000000000000000000000000000000000000000000000000000000000000000080156108fc02916000818181858888f19350505050158015610369573d6000803e3d6000fd5b5050565b600081815b84518110156103a85761039e82868381518110610391576103916104e6565b60200260200101516103b0565b9150600101610372565b509392505050565b60008183106103cc5760008281526020849052604090206103db565b60008381526020839052604090205b9392505050565b634e487b7160e01b600052604160045260246000fd5b6000806040838503121561040b57600080fd5b82356001600160a01b038116811461042257600080fd5b9150602083013567ffffffffffffffff81111561043e57600080fd5b8301601f8101851361044f57600080fd5b803567ffffffffffffffff811115610469576104696103e2565b8060051b604051601f19603f830116810181811067ffffffffffffffff82111715610496576104966103e2565b6040529182526020818401810192908101888411156104b457600080fd5b6020850194505b838510156104d7578435808252602095860195909350016104bb565b50809450505050509250929050565b634e487b7160e01b600052603260045260246000fdfea26469706673582212204a387f8f521502221d56bb42d1815322912f4eda3c44f0f9931c7e333ded26ba64736f6c634300081a0033"
      }

      const factory = new ContractFactory(abi, bytecode, signer);

      const contract = await factory.deploy(root, rewardAmountWei);

      console.log("Deploying contract...");
      await contract.waitForDeployment();

      const addr = await contract.getAddress();
      console.log("Contract address:", addr);

      // Save the Merkle tree to Firestore
      await saveMerkleTree(merkleTreeData, addr);

      const tx = await contract.deposit({ value: amountDeposit });

      await tx.wait();

      console.log("Contract funded with:", formatEther(amountDeposit));

      console.log("Transaction hash:", tx.hash);

      setMessage({ type: 'success', content: 'Merkle proof created and contract deployed successfully!' });
    } catch (error) {
      setMessage({ type: 'error', content: `Error: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
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
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Create Merkle Proof and Deploy Contract'}
      </button>

      {message.content && (
        <div className={`mt-4 p-2 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.content}
        </div>
      )}
    </div>
  );
};

export default MerkleProofForm;