import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Orphanage from '../models/Orphanage';
import orphanageView from '../views/orphanages_view';
import * as Yup from 'yup';

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanage);

    const orphanages = await orphanagesRepository.find({
      relations: ['images']
    });

    return response.json(orphanageView.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;
    const orphanagesRepository = getRepository(Orphanage);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images']
    });

    return response.json(orphanageView.render(orphanage));
  },

  async create(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends
    } = request.body;
  
    const orphanagesRepository = getRepository(Orphanage);
  
    const requestImages = request.files as Express.Multer.File[];

    const images = requestImages.map(image => {
      return { path: image.filename }
    });

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: open_on_weekends === 'true',
      images
    };

    const schema = Yup.object().shape({
      name: Yup.string().required('O campo "nome" é obrigatório'),
      latitude: Yup.number().required('O campo "latitude" é obrigatório'),
      longitude: Yup.number().required('O campo "longitude" é obrigatório'),
      about: Yup.string().required('O campo "sobre" é obrigatório').max(300),
      instructions: Yup.string().required('O campo "instruções" é obrigatório'),
      opening_hours: Yup.string().required('O campo "hora de funcionamento" é obrigatório'),
      open_on_weekends: Yup.boolean().required('O campo "aberto nos finais de semana" é obrigatório'),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required('Nome obrigatório')
        })
      )
    });

    await schema.validate(data, { 
      abortEarly: false, 
    });

    const orphanage = orphanagesRepository.create(data);
  
    await orphanagesRepository.save(orphanage);
  
    return response.status(201).json(orphanage);
  }
}