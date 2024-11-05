// deploy.js
const hre = require("hardhat");

async function main() {
    const DiaryContract = await hre.ethers.getContractFactory("DiaryContract");
    const diaryContract = await DiaryContract.deploy();

    await diaryContract.waitForDeployment();

    console.log("DiaryContract deployed to:", await diaryContract.getAddress());

    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("Verifying contract...");
        await hre.run("verify:verify", {
            address: await diaryContract.getAddress(),
            constructorArguments: [],
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
