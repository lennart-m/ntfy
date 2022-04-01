import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {NotificationItem} from "./Notifications";
import theme from "./theme";
import {Chip, FormControl, InputLabel, Link, Select, useMediaQuery} from "@mui/material";
import TextField from "@mui/material/TextField";
import priority1 from "../img/priority-1.svg";
import priority2 from "../img/priority-2.svg";
import priority3 from "../img/priority-3.svg";
import priority4 from "../img/priority-4.svg";
import priority5 from "../img/priority-5.svg";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import {Close} from "@mui/icons-material";
import MenuItem from "@mui/material/MenuItem";
import {basicAuth, formatBytes, shortUrl, splitNoEmpty, splitTopicUrl, validTopicUrl} from "../app/utils";
import Box from "@mui/material/Box";
import Icon from "./Icon";
import DialogFooter from "./DialogFooter";
import api from "../app/Api";
import Divider from "@mui/material/Divider";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import userManager from "../app/UserManager";

const SendDialog = (props) => {
    const [topicUrl, setTopicUrl] = useState(props.topicUrl);
    const [message, setMessage] = useState(props.message || "");
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [priority, setPriority] = useState(3);
    const [clickUrl, setClickUrl] = useState("");
    const [attachUrl, setAttachUrl] = useState("");
    const [attachFile, setAttachFile] = useState(null);
    const [filename, setFilename] = useState("");
    const [filenameEdited, setFilenameEdited] = useState(false);
    const [email, setEmail] = useState("");
    const [delay, setDelay] = useState("");

    const [showTopicUrl, setShowTopicUrl] = useState(props.topicUrl === "");
    const [showClickUrl, setShowClickUrl] = useState(false);
    const [showAttachUrl, setShowAttachUrl] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [showDelay, setShowDelay] = useState(false);

    const showAttachFile = !!attachFile && !showAttachUrl;
    const attachFileInput = useRef();

    const [sendRequest, setSendRequest] = useState(null);
    const [statusText, setStatusText] = useState("");
    const disabled = !!sendRequest;

    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const sendButtonEnabled = (() => {
        if (!validTopicUrl(topicUrl)) {
            return false;
        }
        return true;
    })();
    const handleSubmit = async () => {
        const { baseUrl, topic } = splitTopicUrl(topicUrl);
        const headers = {};
        if (title.trim()) {
            headers["X-Title"] = title.trim();
        }
        if (tags.trim()) {
            headers["X-Tags"] = tags.trim();
        }
        if (priority && priority !== 3) {
            headers["X-Priority"] = priority.toString();
        }
        if (clickUrl.trim()) {
            headers["X-Click"] = clickUrl.trim();
        }
        if (attachUrl.trim()) {
            headers["X-Attach"] = attachUrl.trim();
        }
        if (filename.trim()) {
            headers["X-Filename"] = filename.trim();
        }
        if (email.trim()) {
            headers["X-Email"] = email.trim();
        }
        if (delay.trim()) {
            headers["X-Delay"] = delay.trim();
        }
        if (attachFile && message.trim()) {
            headers["X-Message"] = message.replaceAll("\n", "\\n").trim();
        }
        const body = (attachFile) ? attachFile : message;
        try {
            const user = await userManager.get(baseUrl);
            if (user) {
                headers["Authorization"] = basicAuth(user.username, user.password);
            }
            const progressFn = (ev) => {
                console.log(ev);
                if (ev.loaded > 0 && ev.total > 0) {
                    const percent = Math.round(ev.loaded * 100.0 / ev.total);
                    setStatusText(`Uploading ${formatBytes(ev.loaded)}/${formatBytes(ev.total)} (${percent}%) ...`);
                } else {
                    setStatusText(`Uploading ...`);
                }
            };
            const request = api.publishXHR(baseUrl, topic, body, headers, progressFn);
            setSendRequest(request);
            await request;
            setStatusText("Message published");
            //props.onClose();
        } catch (e) {
            console.log("error", e);
            setStatusText("An error occurred");
        }
        setSendRequest(null);
    };
    const handleAttachFileClick = () => {
        attachFileInput.current.click();
    };
    const handleAttachFileChanged = (ev) => {
        const file = ev.target.files[0];
        setAttachFile(file);
        setFilename(file.name);
        console.log(ev.target.files[0]);
        console.log(URL.createObjectURL(ev.target.files[0]));
    };
    return (
        <Dialog maxWidth="md" open={props.open} onClose={props.onCancel} fullScreen={fullScreen}>
            <DialogTitle>Publish to {shortUrl(topicUrl)}</DialogTitle>
            <DialogContent>
                {showTopicUrl &&
                    <ClosableRow disabled={disabled} onClose={() => {
                        setTopicUrl(props.topicUrl);
                        setShowTopicUrl(false);
                    }}>
                        <TextField
                            margin="dense"
                            label="Topic URL"
                            value={topicUrl}
                            onChange={ev => setTopicUrl(ev.target.value)}
                            disabled={disabled}
                            type="text"
                            variant="standard"
                            fullWidth
                            required
                        />
                    </ClosableRow>
                }
                <TextField
                    margin="dense"
                    label="Title"
                    value={title}
                    onChange={ev => setTitle(ev.target.value)}
                    disabled={disabled}
                    type="text"
                    fullWidth
                    variant="standard"
                    placeholder="Notification title, e.g. Disk space alert"
                />
                <TextField
                    margin="dense"
                    label="Message"
                    placeholder="Type the main message body here."
                    value={message}
                    onChange={ev => setMessage(ev.target.value)}
                    disabled={disabled}
                    type="text"
                    variant="standard"
                    rows={5}
                    fullWidth
                    autoFocus
                    multiline
                />
                <div style={{display: 'flex'}}>
                    <DialogIconButton disabled={disabled} onClick={() => null}><InsertEmoticonIcon/></DialogIconButton>
                    <TextField
                        margin="dense"
                        label="Tags"
                        placeholder="Comma-separated list of tags, e.g. warning, srv1-backup"
                        value={tags}
                        onChange={ev => setTags(ev.target.value)}
                        disabled={disabled}
                        type="text"
                        variant="standard"
                        sx={{flexGrow: 1, marginRight: 1}}
                    />
                    <FormControl
                        variant="standard"
                        margin="dense"
                        sx={{minWidth: 120, maxWidth: 200, flexGrow: 1}}
                    >
                        <InputLabel/>
                        <Select
                            label="Priority"
                            margin="dense"
                            value={priority}
                            onChange={(ev) => setPriority(ev.target.value)}
                            disabled={disabled}
                        >
                            {[5,4,3,2,1].map(priority =>
                                <MenuItem value={priority}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <img src={priorities[priority].file} style={{marginRight: "8px"}}/>
                                        <div>{priorities[priority].label}</div>
                                    </div>
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </div>
                {showClickUrl &&
                    <ClosableRow disabled={disabled} onClose={() => {
                        setClickUrl("");
                        setShowClickUrl(false);
                    }}>
                        <TextField
                            margin="dense"
                            label="Click URL"
                            placeholder="URL that is opened when notification is clicked"
                            value={clickUrl}
                            onChange={ev => setClickUrl(ev.target.value)}
                            disabled={disabled}
                            type="url"
                            fullWidth
                            variant="standard"
                        />
                    </ClosableRow>
                }
                {showEmail &&
                    <ClosableRow disabled={disabled} onClose={() => {
                        setEmail("");
                        setShowEmail(false);
                    }}>
                        <TextField
                            margin="dense"
                            label="Email"
                            placeholder="Address to forward the message to, e.g. phil@example.com"
                            value={email}
                            onChange={ev => setEmail(ev.target.value)}
                            disabled={disabled}
                            type="email"
                            variant="standard"
                            fullWidth
                        />
                    </ClosableRow>
                }
                {showAttachUrl &&
                    <ClosableRow disabled={disabled} onClose={() => {
                        setAttachUrl("");
                        setFilename("");
                        setFilenameEdited(false);
                        setShowAttachUrl(false);
                    }}>
                        <TextField
                            margin="dense"
                            label="Attachment URL"
                            placeholder="Attach file by URL, e.g. https://f-droid.org/F-Droid.apk"
                            value={attachUrl}
                            onChange={ev => {
                                const url = ev.target.value;
                                setAttachUrl(url);
                                if (!filenameEdited) {
                                    try {
                                        const u = new URL(url);
                                        const parts = u.pathname.split("/");
                                        if (parts.length > 0) {
                                            setFilename(parts[parts.length-1]);
                                        }
                                    } catch (e) {
                                        // Do nothing
                                    }
                                }
                            }}
                            disabled={disabled}
                            type="url"
                            variant="standard"
                            sx={{flexGrow: 5, marginRight: 1}}
                        />
                        <TextField
                            margin="dense"
                            label="Filename"
                            placeholder="Attachment filename"
                            value={filename}
                            onChange={ev => {
                                setFilename(ev.target.value);
                                setFilenameEdited(true);
                            }}
                            disabled={disabled}
                            type="text"
                            variant="standard"
                            sx={{flexGrow: 1}}
                        />
                    </ClosableRow>
                }
                <input
                    type="file"
                    ref={attachFileInput}
                    onChange={handleAttachFileChanged}
                    style={{ display: 'none' }}
                />
                {showAttachFile && <AttachmentBox
                    file={attachFile}
                    filename={filename}
                    disabled={disabled}
                    onChangeFilename={(f) => setFilename(f)}
                    onClose={() => {
                        setAttachFile(null);
                        setFilename("");
                    }}
                />}
                {showDelay &&
                    <ClosableRow disabled={disabled} onClose={() => {
                        setDelay("");
                        setShowDelay(false);
                    }}>
                        <TextField
                            margin="dense"
                            label="Delay"
                            placeholder="Unix timestamp, duration or English natural language"
                            value={delay}
                            onChange={ev => setDelay(ev.target.value)}
                            disabled={disabled}
                            type="text"
                            variant="standard"
                            fullWidth
                        />
                    </ClosableRow>
                }
                <Typography variant="body1" sx={{marginTop: 2, marginBottom: 1}}>
                    Other features:
                </Typography>
                <div>
                    {!showClickUrl && <Chip clickable disabled={disabled} label="Click URL" onClick={() => setShowClickUrl(true)} sx={{marginRight: 1, marginBottom: 1}}/>}
                    {!showEmail && <Chip clickable disabled={disabled} label="Forward to email" onClick={() => setShowEmail(true)} sx={{marginRight: 1, marginBottom: 1}}/>}
                    {!showAttachUrl && !showAttachFile && <Chip clickable disabled={disabled} label="Attach file by URL" onClick={() => setShowAttachUrl(true)} sx={{marginRight: 1, marginBottom: 1}}/>}
                    {!showAttachFile && !showAttachUrl && <Chip clickable disabled={disabled} label="Attach local file" onClick={() => handleAttachFileClick()} sx={{marginRight: 1, marginBottom: 1}}/>}
                    {!showDelay && <Chip clickable disabled={disabled} label="Delay delivery" onClick={() => setShowDelay(true)} sx={{marginRight: 1, marginBottom: 1}}/>}
                    {!showTopicUrl && <Chip clickable disabled={disabled} label="Change topic" onClick={() => setShowTopicUrl(true)} sx={{marginRight: 1, marginBottom: 1}}/>}
                </div>
                <Typography variant="body1" sx={{marginTop: 1, marginBottom: 1}}>
                    For examples and a detailed description of all send features, please
                    refer to the <Link href="/docs">documentation</Link>.
                </Typography>
            </DialogContent>
            <DialogFooter status={statusText}>
                {sendRequest && <Button onClick={() => sendRequest.abort()}>Cancel sending</Button>}
                {!sendRequest &&
                    <>
                        <Button onClick={props.onClose}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={!sendButtonEnabled}>Send</Button>
                    </>
                }
            </DialogFooter>
        </Dialog>
    );
};

const Row = (props) => {
    return (
        <div style={{display: 'flex'}}>
            {props.children}
        </div>
    );
};

const ClosableRow = (props) => {
    return (
        <Row>
            {props.children}
            <DialogIconButton disabled={props.disabled} onClick={props.onClose} sx={{marginLeft: "6px"}}><Close/></DialogIconButton>
        </Row>
    );
};

const DialogIconButton = (props) => {
    const sx = props.sx || {};
    return (
        <IconButton
            color="inherit"
            size="large"
            edge="start"
            sx={{height: "45px", marginTop: "17px", ...sx}}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.children}
        </IconButton>
    );
};

const AttachmentBox = (props) => {
    const file = props.file;
    return (
        <>
            <Typography variant="body1" sx={{marginTop: 2}}>
                Attached file:
            </Typography>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                padding: 0.5,
                borderRadius: '4px',
            }}>
                <Icon type={file.type}/>
                <Typography variant="body2" sx={{ marginLeft: 1, textAlign: 'left', color: 'text.primary' }}>
                    <ExpandingTextField
                        minWidth={140}
                        variant="body2"
                        value={props.filename}
                        onChange={(ev) => props.onChangeFilename(ev.target.value)}
                        disabled={props.disabled}
                    />
                    <br/>
                    {formatBytes(file.size)}
                </Typography>
                <DialogIconButton disabled={props.disabled} onClick={props.onClose} sx={{marginLeft: "6px"}}><Close/></DialogIconButton>
            </Box>
        </>
    );
};

const ExpandingTextField = (props) => {
    const invisibleFieldRef = useRef();
    const [textWidth, setTextWidth] = useState(props.minWidth);
    const determineTextWidth = () => {
        const boundingRect = invisibleFieldRef?.current?.getBoundingClientRect();
        if (!boundingRect) {
            return props.minWidth;
        }
        return (boundingRect.width >= props.minWidth) ? Math.round(boundingRect.width) : props.minWidth;
    };
    useEffect(() => {
        setTextWidth(determineTextWidth() + 5);
    }, [props.value]);
    return (
        <>
            <Typography
                ref={invisibleFieldRef}
                component="span"
                variant={props.variant}
                sx={{position: "absolute", left: "-100%"}}
            >
                {props.value}
            </Typography>
            <TextField
                margin="dense"
                placeholder="Attachment filename"
                value={props.value}
                onChange={props.onChange}
                type="text"
                variant="standard"
                sx={{ width: `${textWidth}px`, borderBottom: "none" }}
                InputProps={{ style: { fontSize: theme.typography[props.variant].fontSize } }}
                inputProps={{ style: { paddingBottom: 0, paddingTop: 0 } }}
                disabled={props.disabled}
            />
        </>
    )
};

const priorities = {
    1: { label: "Minimum priority", file: priority1 },
    2: { label: "Low priority", file: priority2 },
    3: { label: "Default priority", file: priority3 },
    4: { label: "High priority", file: priority4 },
    5: { label: "Maximum priority", file: priority5 }
};

export default SendDialog;