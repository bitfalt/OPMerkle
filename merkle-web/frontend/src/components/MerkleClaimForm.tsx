declare global {
    interface Window{
      ethereum?:any
    }
  }
  import React, { useState, useEffect } from 'react';
  import { ethers } from 'ethers';
  
  const MerkleClaimForm: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [contractAddress, setContractAddress] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
  
    const connectWallet = async () => {
      setErrorMessage('');
      let provider;
  
      try {
        if (window.ethereum == null) {
          console.log("MetaMask not installed; using read-only defaults");
          provider = ethers.getDefaultProvider();
        } else {
          provider = new ethers.BrowserProvider(window.ethereum);
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
  
    const handleClaim = () => {
      console.log("Claiming tokens...");
    };
  
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
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
            <img src="src/assets/icons/MetaMask_Fox.svg" alt="MetaMask Icon" className="w-6 h-6 ml-2" />
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
        >
          Claim Tokens
          <img src="src/assets/icons/op-logo.svg" alt="OP Logo" className="w-5 h-5 ml-2 inline-block align-middle" />
        </button>
  
        {errorMessage && (
          <div className="mt-4 p-2 rounded bg-red-100 text-red-800">
            {errorMessage}
          </div>
        )}
      </div>
    );
  };
  
  export default MerkleClaimForm;
  