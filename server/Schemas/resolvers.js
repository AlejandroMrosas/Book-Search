const { AuthenticationError } = require('apollo-server-express');
const { sign } = require('jsonwebtoken');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = { 
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findone({ _id: context.user._id})
        .select('-__v -password')
        .populate('savedBooks')
        .populate('bookCount');
        return userData;
      } 

      throw new AuthenticationError('Please log in')
    },
    users: async () => {
      return User.find()
      .select('-__v -password')
      .populate('savedBooks')
      .populate('bookCount');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('friends')
        .populate('thoughts');
    },
    savedBooks: async (parent, {username}) => {
      const params = username ? { username } : {};
      return Book.find(params).sort({ createdAt: -1 });
    },
    Books: async (parent, { _id }) => {
      return Books.findOne({ _id });
    }
  },

   Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, { bookId, authors, description, title, image, link }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context._id},
          { $push: { savedBooks: { bookId, authors, description, title, image, link}}},
        )
        return updatedUser
      }
      throw new AuthenticationError('Log in required')
    }
  }
}

module.exports = resolvers;
