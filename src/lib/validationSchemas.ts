import * as Yup from 'yup';

export const AddStuffSchema = Yup.object({
  name: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  condition: Yup.string().oneOf(['excellent', 'good', 'fair', 'poor']).required(),
  owner: Yup.string().required(),
});

export const EditStuffSchema = Yup.object({
  id: Yup.number().required(),
  name: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  condition: Yup.string().oneOf(['excellent', 'good', 'fair', 'poor']).required(),
  owner: Yup.string().required(),
});

export const CreateEventSchema = Yup.object({
  name: Yup.string().required(),
  description: Yup.string().required(),
  type: Yup.string().required(),
  format: Yup.string().required(),
  startDate: Yup.string().required(),
  endDate: Yup.string(),
  numberOfPlayers: Yup.number().positive().required(),
  owner: Yup.string().required(),
});
