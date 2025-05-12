import {io} from 'socket.io-client'

 const socket=io("https://impager.onrender.com/",{
    withCredentials: true,
})
export default socket