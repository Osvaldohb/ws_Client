import React, { useState,useEffect } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client'

var stompCLient=null;

function ChatRoom() {

    const [publicChats,setPublicChats]=useState([]);
    const [Tab, setTab] = useState("CHATROOM");
    const [privateChats,setPrivateChats]=useState(new Map());
    const [userData,setUserData]=useState({
        username:"",
        receivername:"",
        connected:false,
        message:""
    });

    useEffect(()=>{
        console.log(userData);
    },[userData]);

    const handleValue=(event)=>{
        const {value,name}=event.target;
        setUserData({...userData,[name]:value});
    }


    

    const connect=()=>{
        let Sock=new SockJS('http://localhost:8080/ws');
        stompCLient=over(Sock);
        stompCLient.connect({},onConnected,onError);
    }

    const onConnected= ()=>{
        setUserData({...userData,"connected":true});
        stompCLient.subscribe('/chatroom/public',onPublicMessageReceived);
        stompCLient.subscribe('/user/'+userData.username+'/private',onPrivateMessageReceived);

        userJoin();
    }

    const userJoin=()=>{
       
            let chatMessage={
                senderName:userData.username,
                status:'JOIN'
            };
            stompCLient.send('/app/message',{},JSON.stringify(chatMessage));
        
    }
    


    const onError=(err)=>{
        console.log(err);
    }


    const onPublicMessageReceived=(payload)=>{
        let payloadData=JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                     setPrivateChats(new Map(privateChats));
              }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break; 
             default:
                console.log("error");
                break;   
        }
    }

    const onPrivateMessageReceived=(payload)=>{
        let payloadData=JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list = [];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const sendPublicMessage=()=>{
        if(stompCLient){
            let chatMessage={
                senderName:userData.username,
                message:userData.message,
                status:'MESSAGE'
            };
            stompCLient.send('/app/message',{},JSON.stringify(chatMessage));
            setUserData({...userData,"message":""});
        }
    }

    const sendPrivateMessage=()=>{
        if(stompCLient){
            let chatMessage={
                senderName:userData.username,
                receiverName:Tab,
                message:userData.message,
                status:'MESSAGE'
            };
            if(userData.username !==Tab){
                privateChats.get(Tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompCLient.send('/app/private-message',{},JSON.stringify(chatMessage));
            setUserData({...userData,"message":""});
        }
    }

  return (
    <div className='container'>
    {userData.connected?
        <div className='chat-box'>
            <div className='member-list'>
                <ul>
                    <li onClick={()=>{setTab("CHATROOM")}} className={`member ${Tab==="CHATROOM" && "active"}`}>ChatRoom</li>
                    {[...privateChats.keys()].map((name,index)=>(
                        <li onClick={()=>{setTab(name)}} className={`member ${Tab===name && "active"}`} key={index}>
                            {name}
                        </li>
                    ))}
                </ul>
            </div>
           {Tab==="CHATROOM" &&<div className='chat-content'>
           <ul className='chat-messages'>
            {publicChats.map((chat,index)=>(
                <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                <div className="message-data">{chat.message}</div>
                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
            </li>
                    ))}
                    </ul>
                   <div className='send-message'>
                   <input type="text" className='input-message' name='message' placeholder='Enter Public Message' value={userData.message} onChange={handleValue} />
                   <button type='button' className='send-button' onClick={sendPublicMessage}>Send</button>
                   </div>  
            </div>}
            {Tab!=="CHATROOM" &&<div className='chat-content'>
            <ul className='chat-messages'>
            {[...privateChats.get(Tab)].map((chat,index)=>(
                        <li className='message' key={index}>
                            {chat.senderName !== userData.username && <div className='avatar'>{chat.senderName}</div>}
                            <div className='message-data'>{chat.message}</div>
                            {chat.senderName === userData.username && <div className='avatar self'>{chat.senderName}</div>}
                        </li>
                    ))}
                    </ul>
                    <div className='send-message'>
                   <input type="text" name='message' className='input-message' placeholder={`Enter Private Message for ${Tab}`} value={userData.message} onChange={handleValue} />
                   <button type='button' className='send-button' onClick={sendPrivateMessage}>Send</button>
                   </div>  
            </div>}
        </div>
        :
        <div className='register'>
            <input id='user-name' placeholder='Enter the UserName' value={userData.username} name='username' onChange={handleValue} />
            <button type='button' onClick={connect}>Connect</button>
        </div>}
    </div>
  )
}

export default ChatRoom