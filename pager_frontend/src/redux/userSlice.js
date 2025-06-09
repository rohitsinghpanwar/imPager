import { createSlice } from '@reduxjs/toolkit';

// Default user object if localStorage is empty
const defaultUser = {
  userId: null,
  username: '',
  profileurl: '',
  email: '',
};

// Load user once from localStorage
const storedUser = JSON.parse(localStorage.getItem('impUser'));
const localUser = storedUser
  ? {
      userId: storedUser._id,
      username: storedUser.username,
      profileurl: storedUser.profilePhoto,
      email: storedUser.email,
    }
  : defaultUser;

const userSlice = createSlice({
  name: 'user',
  initialState: localUser,
  reducers: {
    setUser: (state, action) => {
      const { _id, username, profilePhoto, email } = action.payload;
      state.userId = _id;
      state.username = username;
      state.profileurl = profilePhoto;
      state.email = email;
    },

    clearUser: (state) => {
      state.userId = null;
      state.username = '';
      state.profileurl = '';
      state.email = '';
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
