declare global {
    interface Window{
      ethereum?:any
    }
  }
  import React, { useState, useEffect } from 'react';
  import { Contract, ethers, formatEther } from 'ethers';
  import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
  
  const MerkleClaimForm: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [contractAddress, setContractAddress] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [signer, setSigner] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
  
    const connectWallet = async () => {
      setErrorMessage('');

      let provider;
  
      try {
        if (window.ethereum == null) {
          console.log("MetaMask not installed; using read-only defaults");
          provider = ethers.getDefaultProvider();
        } else {
          provider = new ethers.BrowserProvider(window.ethereum);
          setSigner(await provider.getSigner());
          const accounts = await provider.send("eth_requestAccounts", []);
          setWalletAddress(accounts[0]); // Establece la dirección de la cuenta conectada
        }
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        setErrorMessage("Failed to connect to wallet. Please check if MetaMask is installed and try again.");
      }
    };
  
    useEffect(() => {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress('');
        }
      };
  
      const handleChainChanged = () => {
        window.location.reload(); // Recargar la página para aplicar cambios de red
      };
  
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
  
        return () => {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
      }
    }, []);
  
    const handleClaim = async () => {
      setIsLoading(true);
      if (!walletAddress) {
        setErrorMessage("Please connect your wallet first.");
        return;
      }

      if (!contractAddress) {
        setErrorMessage("Please enter the smart contract address.");
        return;
      }

      // Get Merkle Tree data from API
      const response = await fetch(`/api/merkle/${contractAddress}`);
      const data = await response.json();
      const merkleTreeData = data.merkleTree;

      const merkleTree = StandardMerkleTree.load(JSON.parse(JSON.stringify(merkleTreeData)));
      let proof;

      // Generate proof for connected wallet address
      for (const [i, v] of merkleTree.entries()) {
        if (v[0].toLowerCase() === walletAddress) {
          proof = merkleTree.getProof(i);
        }
      }
      if (!proof) {
        setErrorMessage("No tokens to claim for this address.");
        return;
      }

      // Connect with deployed smart contract
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

      const contract = new Contract(contractAddress, abi, signer);

      // Withdraw tokens if proof is valid
      const rewardAmount = await contract.amount();
      console.log("Reward amount:", formatEther(rewardAmount));

      const tx = await contract.claim(walletAddress, proof);

      console.log("Claiming tokens...");


      await tx.wait();

      console.log("Transaction hash:", tx.hash);

      setSuccessMessage("Tokens claimed successfully!");
      setIsLoading(false);

    };
  
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Merkle Claim</h2>
  
        {walletAddress ? (
            <div className="mb-4 p-4 bg-blue-100 border border-blue-200 rounded-md text-center">
                <p className="text-blue-800 font-semibold text-lg">
                    Connected account:
                </p>
                <p className="text-blue-900 break-all mt-1">{walletAddress}</p>
            </div>  
        ) : (
          <button 
            onClick={connectWallet}
            className="w-full bg-green-500 text-white py-2 px-4 rounded mb-4 hover:bg-green-600 flex items-center justify-center"
          >
            Connect Wallet
            <img src="/MetaMask_Fox.svg" alt="MetaMask Icon" className="w-6 h-6 ml-2" />
          </button>
        )}
  
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Smart Contract Address
          </label>
          <input 
            type="text" 
            placeholder="0x..."
            className="w-full p-2 border rounded"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
        </div>
  
        <button 
          onClick={handleClaim}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Claim Tokens'}
          <img src="/op-logo.svg" alt="OP Logo" className="w-5 h-5 ml-2 inline-block align-middle" />
        </button>
        
        {successMessage && (
          <div className="mt-4 p-2 rounded bg-green-100 text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-2 rounded bg-red-100 text-red-700">
            {errorMessage}
          </div>
        )}
      </div>
    );
  };
  
  export default MerkleClaimForm;
  