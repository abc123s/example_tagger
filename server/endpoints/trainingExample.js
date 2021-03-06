import express from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import { Op } from 'sequelize';
import _ from 'lodash';

import { paramsValidator } from '../lib/validator';

import { TrainingExample } from '../sequelize/models';

const router = express.Router();
router.use(bodyParser.json());

const schema = {
  read: Joi.object()
    .keys({
      id: Joi.number().required(),
    })
    .required(),
};

/**
 * Get training example by id
 */
router.get('/:id', paramsValidator(schema.read), (req, res, next) => {
  TrainingExample.findByPk(parseInt(req.params.id, 10))
    .then(example => {
      res.json(example);
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/**
 * Get next training example
 */
router.get('/next/:id', paramsValidator(schema.read), (req, res, next) => {
  TrainingExample.findOne({
    where: {
      id: {
        [Op.gt]: parseInt(req.params.id, 10),
      },
    },
    order: [['id', 'ASC']],
  })
    .then(nextExample => {
      res.json(nextExample);
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/**
 * Get prev training exzample
 */
router.get('/prev/:id', paramsValidator(schema.read), (req, res, next) => {
  TrainingExample.findOne({
    where: {
      id: {
        [Op.lt]: parseInt(req.params.id, 10),
      },
    },
    order: [['id', 'DESC']],
  })
    .then(prevExample => {
      res.json(prevExample);
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/**
 * Get next untagged training example
 */
router.get(
  '/nextUntagged/:id',
  paramsValidator(schema.read),
  (req, res, next) => {
    TrainingExample.findOne({
      where: {
        id: {
          [Op.gt]: parseInt(req.params.id, 10),
        },
        tags: null,
        escalated: false,
      },
      order: [['id', 'ASC']],
    })
      .then(nextUntaggedExample => {
        res.json(nextUntaggedExample);
      })
      .catch(err => {
        console.log(err);
        next(err);
      });
  }
);

/**
 * Get next unmatched training example
 */
router.get(
  '/nextUnmatched/:id',
  paramsValidator(schema.read),
  (req, res, next) => {
    TrainingExample.findOne({
      where: {
        id: {
          [Op.gt]: parseInt(req.params.id, 10),
        },
        ingredients: null,
        matchEscalated: false,
      },
      order: [['id', 'ASC']],
    })
      .then(nextUnmatchedExample => {
        res.json(nextUnmatchedExample);
      })
      .catch(err => {
        console.log(err);
        next(err);
      });
  }
);

/**
 * Add tags to training example
 */
router.post('/tag/:id', paramsValidator(schema.read), (req, res, next) => {
  TrainingExample.findByPk(parseInt(req.params.id, 10))
    .then(exampleToTag => {
      if (exampleToTag.tokens.length !== req.body.tags.length) {
        throw new Error(
          `Provided incorrect number of tags: expected ${
            exampleToTag.tokens.length
          } but got ${req.body.tags.length}`
        );
      }
      return exampleToTag.update({
        tags: req.body.tags,
      });
    })
    .then(updatedExample => {
      res.json(updatedExample);
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/**
 * Add matched ingredients to training example
 */
router.post('/match/:id', paramsValidator(schema.read), (req, res, next) => {
  TrainingExample.findByPk(parseInt(req.params.id, 10))
    .then(exampleToMatch => {
      if (!exampleToMatch.tags || !exampleToMatch.tags.length) {
        throw new Error(
          'Tried to match an example that has not yet been tagged. Please tag before matching.'
        );
      }

      if (
        _.filter(exampleToMatch.tags, tag => tag === 'B-NAME').length !==
        req.body.ingredients.length
      ) {
        throw new Error(
          `Provided incorrect number of ingredients: expected ${
            _.filter(exampleToMatch.tags, tag => tag === 'B-NAME').length
          } but got ${req.body.ingredients.length}`
        );
      }

      return exampleToMatch.update({
        ingredients: req.body.ingredients,
      });
    })
    .then(updatedExample => {
      res.json(updatedExample);
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/**
 * Escalate training example for tagging
 */
router.post('/escalate/:id', paramsValidator(schema.read), (req, res, next) => {
  TrainingExample.findByPk(parseInt(req.params.id, 10))
    .then(exampleToEscalate => {
      return exampleToEscalate.update({
        escalated: true,
      });
    })
    .then(updatedExample => {
      res.json(updatedExample);
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
});

/**
 * Escalate training example for matching
 */
router.post(
  '/escalateMatch/:id',
  paramsValidator(schema.read),
  (req, res, next) => {
    TrainingExample.findByPk(parseInt(req.params.id, 10))
      .then(exampleToEscalate => {
        return exampleToEscalate.update({
          matchEscalated: true,
        });
      })
      .then(updatedExample => {
        res.json(updatedExample);
      })
      .catch(err => {
        console.log(err);
        next(err);
      });
  }
);

/**
 * Errors on "/api/trainingExample/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  const newErr = {
    ...err,
    response: {
      message: err.message,
      internalCode: err.code,
    },
  };
  next(newErr);
});

export default router;
