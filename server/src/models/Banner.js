import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    imageSourceType: {
      type: String,
      enum: ['UPLOAD', 'URL'],
      default: 'URL',
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    heading: {
      type: String,
      trim: true,
      default: '',
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    buttonLabel: {
      type: String,
      trim: true,
      default: '',
    },
    buttonDestinationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    altText: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

export const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
