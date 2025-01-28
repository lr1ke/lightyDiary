import { ethers } from 'ethers';


export async function fetchAllEntryCount() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, DiaryContract.abi, signer);

    const allEntryCount = contract


}

export async function fetchUserEntryCount(userAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, DiaryContract.abi, signer);

    const userEntryIds = await contract.userEntries(userAddress);
    
    const userEntryCount = userEntryIds.length;

    return userEntryCount;
}
