import createIdentity from "@interep/identity"
import createProof from "@interep/proof"
import detectEthereumProvider from "@metamask/detect-provider"
import ReplayIcon from "@mui/icons-material/Replay"
import { LoadingButton } from "@mui/lab"
import {
    Box,
    Button,
    IconButton,
    Link,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Paper,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Theme,
    Typography
} from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { Contract, ethers } from "ethers"
import React from "react"
import ReactDOM from "react-dom"
import { abi as contractAbi } from "../static/GithubInterepNFT.json"

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            flex: 1
        },
        content: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        },
        results: {
            position: "relative",
            marginTop: 20,
            width: 530,
            textAlign: "center"
        },
        resetButton: {
            zIndex: 1,
            right: 5,
            top: 5
        },
        listItem: {
            paddingTop: 0,
            paddingBottom: 0
        }
    })
)

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#66A8C9"
        }
    }
})

const contractAddress = "0x05c3416ae2E49Ce649223B70e4d745e5686F9860"

function App() {
    const classes = useStyles()
    const [_ethereumProvider, setEthereumProvider] = React.useState<any>()
    const [_transactionHash, setTransactionHash] = React.useState<string>("")
    const [_error, setError] = React.useState<boolean>(false)
    const [_loading, setLoading] = React.useState<boolean>(false)
    const [_activeStep, setActiveStep] = React.useState<number>(0)

    React.useEffect(() => {
        ;(async function IIFE() {
            if (!_ethereumProvider) {
                const ethereumProvider = (await detectEthereumProvider()) as any

                if (ethereumProvider) {
                    setEthereumProvider(ethereumProvider)
                } else {
                    console.error("Please install Metamask!")
                }
            } else {
                const accounts = await _ethereumProvider.request({ method: "eth_accounts" })

                if (accounts.length !== 0 && accounts[0]) {
                    setActiveStep(1)
                }

                _ethereumProvider.on("accountsChanged", (newAccounts: string[]) => {
                    if (newAccounts.length === 0) {
                        setActiveStep(0)
                        setTransactionHash("")
                    }
                })
            }
        })()
    }, [_ethereumProvider])

    function handleNext() {
        setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
        setError(false)
    }

    function resetSteps() {
        setActiveStep(1)
        setTransactionHash("")
    }

    async function connect() {
        await _ethereumProvider.request({ method: "eth_requestAccounts" })
        await _ethereumProvider.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                    chainId: "0x2a"
                }
            ]
        })
        handleNext()
    }

    async function mintNFT() {
        const ethersProvider = new ethers.providers.Web3Provider(_ethereumProvider)
        const signer = ethersProvider.getSigner()
        const identity = await createIdentity((message: string) => signer.signMessage(message), "Github")

        // The external nullifier is the group id.
        const externalNullifier = BigInt(
            "19792997538846952138225145850176205122934145224103991348074597128209030420613"
        )
        const signal = "github-nft"

        const zkFiles = { wasmFilePath: "./semaphore.wasm", zkeyFilePath: "./semaphore_final.zkey" }

        setLoading(true)

        try {
            const { publicSignals, solidityProof } = await createProof(
                identity,
                {
                    provider: "github",
                    name: "gold"
                },
                externalNullifier,
                signal,
                zkFiles
            )
            const contract = new Contract(contractAddress, contractAbi)
            const transaction = await contract.connect(signer).mint(publicSignals.nullifierHash, solidityProof)

            setTransactionHash(transaction.hash)

            setActiveStep(2)
        } catch (error) {
            console.error(error)

            setError(true)

            resetSteps()
        }

        setLoading(false)
    }

    return (
        <ThemeProvider theme={theme}>
            <Paper className={classes.container} elevation={0} square={true}>
                <Box className={classes.content}>
                    <Typography variant="h4" sx={{ mb: 2 }}>
                        Github Interep NFTs
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 4 }}>
                        Join an Interep Github gold group on&nbsp;
                        <Link href="https://kovan.interep.link" underline="hover" rel="noreferrer" target="_blank">
                            kovan.interep.link
                        </Link>
                        , wait 1 minute and mint your NFT.
                    </Typography>

                    <Stepper activeStep={_activeStep} orientation="vertical">
                        <Step>
                            <StepLabel>Connect your wallet with Metamask</StepLabel>
                            <StepContent style={{ width: 400 }}>
                                <Button
                                    fullWidth
                                    onClick={() => connect()}
                                    variant="outlined"
                                    disabled={!_ethereumProvider}
                                >
                                    Connect wallet
                                </Button>
                            </StepContent>
                        </Step>
                        <Step>
                            <StepLabel error={!!_error}>Mint your Interep NFT</StepLabel>
                            <StepContent style={{ width: 400 }}>
                                <LoadingButton
                                    loading={_loading}
                                    loadingIndicator="Loading..."
                                    fullWidth
                                    onClick={() => mintNFT()}
                                    variant="outlined"
                                >
                                    Mint NFT
                                </LoadingButton>
                            </StepContent>
                        </Step>
                    </Stepper>

                    {_activeStep === 2 && (
                        <Paper className={classes.results} sx={{ p: 3 }}>
                            <IconButton
                                onClick={() => resetSteps()}
                                className={classes.resetButton}
                                style={{ position: "absolute" }}
                            >
                                <ReplayIcon />
                            </IconButton>
                            <Typography variant="body1">
                                You have minted your Interep NFT successfully. Check the&nbsp;
                                <Link
                                    href={"https://kovan.etherscan.io/tx/" + _transactionHash}
                                    underline="hover"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    transaction
                                </Link>
                                !
                            </Typography>
                        </Paper>
                    )}

                    {_error && (
                        <Paper className={classes.results} sx={{ p: 3 }}>
                            <Typography variant="body1">
                                Sorry, there was an error in the creation of your Semaphore proof.
                            </Typography>
                            <List sx={{ mb: 0 }}>
                                <ListItem>
                                    <ListItemText secondary="• Make sure you have enough balance in your wallet." />
                                </ListItem>
                                <ListItem>
                                    <ListItemText secondary="• Verify that you are part of a gold group." />
                                </ListItem>
                                <ListItemButton
                                    component="a"
                                    href={"https://kovan.etherscan.io/token/" + contractAddress}
                                    target="_blank"
                                >
                                    <ListItemText secondary="• Click here to check if you have already minted your NFT." />
                                </ListItemButton>
                            </List>
                            <Typography variant="body1">{_error}</Typography>
                        </Paper>
                    )}
                </Box>
            </Paper>
        </ThemeProvider>
    )
}

const root = document.getElementById("root")

ReactDOM.render(<App />, root)
