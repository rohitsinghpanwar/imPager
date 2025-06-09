import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import Signup from './components/Signup.jsx'
import Login from './components/Login.jsx'
import Chat from './components/Chat.jsx'
import Navbar from './components/Navbar.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import ForgotPassword from './components/ForgotPassword.jsx'
import EmailVerification from './components/EmailVerification.jsx'
import ChangePassword from './components/ChangePassword.jsx'
import PasswordChangeWrapper from './components/PasswordChangeWrapper.jsx'
import {Provider} from 'react-redux'
import { store } from './redux/store.js'
import UserGuide from './components/UserGuide.jsx'

const route=createBrowserRouter([{
  element:<><Navbar/><App/></>,
  path:"/"
},{
  element:<><Navbar/><Signup/></>,
  path:"/register"
},{
  element:<><Navbar/><Login/></>,
  path:'/login'
},
,{
  element:<><Navbar/><UserGuide/></>,
  path:'/userguide'
},
{
  path:'/forgotpassword',
  element: <PasswordChangeWrapper/>,
  children:[
    {
      index:true,
      element:<ForgotPassword/>
    },
    {
      path: 'emailverification',
      element: <EmailVerification/>
    },
    {
      path:'changepassword',
      element: <ChangePassword/>
    }
  ]
},

{
  path:'/chat',
  element:(
    <PrivateRoute>
      <Chat />
    </PrivateRoute>

  ),
  
}])
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
   <RouterProvider router={route}/>
   </Provider>
  </StrictMode>,
)
