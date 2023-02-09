import { deployMockContract } from "@ethereum-waffle/mock-contract"
import { expect } from "chai"
import { constants, Contract, Signer } from "ethers"
import { run } from "hardhat"
import { abi as InterepAbi } from "../build/contracts/@interep/contracts/Interep.sol/Interep.json"
import { GithubInterepNFT } from "../build/typechain"

describe("GithubInterepNFT", () => {
    let contract: GithubInterepNFT
    let accounts: string[]
    let interepMock: Contract

    before(async () => {
        const signers = await run("accounts", { logs: false })

        interepMock = await deployMockContract(signers[0], InterepAbi)

        contract = await run("deploy", {
            logs: false,
            interepAddress: interepMock.address
        })

        accounts = await Promise.all(signers.map((signer: Signer) => signer.getAddress()))
    })

    describe("# mint", () => {
        it("Should mint an Interep NFT", async () => {
            const nullifierHash = 2
            const proof = [1, 2, 3, 4, 5, 6, 7, 8]

            await interepMock.mock.verifyProof.returns()

            const transaction = contract.mint(nullifierHash, proof as any)

            await expect(transaction)
                .to.emit(contract, "Transfer")
                .withArgs(constants.AddressZero, accounts[0], nullifierHash)
        })
    })
})
