import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy", "Deploy an GithubInterepNFT contract")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .addParam("interepAddress", "Interep contract address", undefined, types.string)
    .setAction(async ({ logs, interepAddress }, { ethers }): Promise<Contract> => {
        const ContractFactory = await ethers.getContractFactory("GithubInterepNFT")

        const contract = await ContractFactory.deploy(interepAddress)

        await contract.deployed()

        logs && console.log(`GithubInterepNFT contract has been deployed to: ${contract.address}`)

        return contract
    })
