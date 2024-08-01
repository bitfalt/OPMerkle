import React, { useState } from 'react';
import { ethers, solidityPackedKeccak256, keccak256, ContractFactory, Contract, parseEther, formatEther} from 'ethers';
import { MerkleTree } from 'merkletreejs';

const MerkleProofForm: React.FC = () => {
  const [addresses, setAddresses] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: string; content: string }>({ type: '', content: '' });

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

      const rewardAmountWei = parseEther(rewardAmount);

      // Generate Merkle proof elements for merkletreejs
      const elements = users.map((address) => 
        solidityPackedKeccak256(['address', 'uint256'], [address, rewardAmountWei]));

      console.log("Total wallets: ", elements.length);

      const amountDeposit = rewardAmountWei * BigInt(elements.length);

      console.log("Amount to deposit: ", formatEther(amountDeposit));

      // Create Merkle Tree with merkletreejs
      const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
      const root = merkleTree.getHexRoot();

      // const user = "0x0977De4FbF977Db858A1dC27d588f9F661263d86"

      // const leaf = solidityPackedKeccak256(['address', 'uint256'], [user, rewardAmount]);

      // console.log('Merkle proof elements:', elements);
      // console.log('Merkle proof leaf:', leaf);

      // const proof = merkleTree.getHexProof(leaf);

      // console.log('Merkle proof:', proof);  

      console.log('Merkle root:', root);
      console.log('Creating Merkle proof...');

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
          ]
        }
      ];

      const bytecode = {
        "object": "0x60c0604052348015600f57600080fd5b50604051610586380380610586833981016040819052602c916039565b60809190915260a052605c565b60008060408385031215604b57600080fd5b505080516020909101519092909150565b60805160a0516104e46100a260003960008181609c015281816101400152818161024e015281816102bb0152610344015260008181605601526101b701526104e46000f3fe60806040526004361061003f5760003560e01c80632eb4a7ab14610044578063aa8c217c1461008a578063d0e30db0146100be578063d7aada81146100c8575b600080fd5b34801561005057600080fd5b506100787f000000000000000000000000000000000000000000000000000000000000000081565b60405190815260200160405180910390f35b34801561009657600080fd5b506100787f000000000000000000000000000000000000000000000000000000000000000081565b6100c66100e8565b005b3480156100d457600080fd5b506100c66100e3366004610402565b610122565b604080513381523460208201527f88a5966d370b9919b20f3e2c13ff65706f196a4e32cc2c12bf57088f88525874910160405180910390a1565b6040516bffffffffffffffffffffffff19606085901b1660208201527f000000000000000000000000000000000000000000000000000000000000000060348201526000906054016040516020818303038152906040528051906020012090506101e28383808060200260200160405190810160405280939291908181526020018383602002808284376000920191909152507f000000000000000000000000000000000000000000000000000000000000000092508591506102a39050565b6102335760405162461bcd60e51b815260206004820152601b60248201527f4d65726b6c65436c6173733a20496e76616c69642070726f6f662e000000000060448201526064015b60405180910390fd5b61023c846102b9565b604080516001600160a01b03861681527f000000000000000000000000000000000000000000000000000000000000000060208201527fd8138f8a3f377c5259ca548e70e4c2de94f129f5a11036a15b69513cba2b426a910160405180910390a150505050565b6000826102b0858461038d565b14949350505050565b7f00000000000000000000000000000000000000000000000000000000000000004710156103345760405162461bcd60e51b815260206004820152602260248201527f4d65726b6c65436c6173733a20496e73756666696369656e742062616c616e63604482015261329760f11b606482015260840161022a565b6040516001600160a01b038216907f000000000000000000000000000000000000000000000000000000000000000080156108fc02916000818181858888f19350505050158015610389573d6000803e3d6000fd5b5050565b600081815b84518110156103c8576103be828683815181106103b1576103b1610498565b60200260200101516103d0565b9150600101610392565b509392505050565b60008183106103ec5760008281526020849052604090206103fb565b60008381526020839052604090205b9392505050565b60008060006040848603121561041757600080fd5b83356001600160a01b038116811461042e57600080fd5b9250602084013567ffffffffffffffff81111561044a57600080fd5b8401601f8101861361045b57600080fd5b803567ffffffffffffffff81111561047257600080fd5b8660208260051b840101111561048757600080fd5b939660209190910195509293505050565b634e487b7160e01b600052603260045260246000fdfea264697066735822122042ab2b153c6db571d25cb5afaabbbd544f0e963c313358801396a41b6e36fce364736f6c634300081a0033"
      }

      const factory = new ContractFactory(abi, bytecode, signer);

      const contract = await factory.deploy(root, rewardAmountWei);

      console.log("Deploying contract...");
      await contract.waitForDeployment();

      console.log("Contract deployed at address:", contract.getAddress());

      const tx = await contract.deposit({ value: amountDeposit });

      await tx.wait();

      console.log("Contract funded with:", amountDeposit);

      console.log("Transaction hash:", tx.hash);

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