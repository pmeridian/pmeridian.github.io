// Strategies
const COOPERATE = 'C';
const DEFECT = 'D';

// Strategies for ML 
const COOPERATEML = 0;
const DEFECTML = 1;

const DEBUG = false;
//const DEBUG = true;

const RUNMEMMNGCODE = false;

// const howManyChPerRow = 80;

const POINTS_SYSTEM = {
  'CC': [3, 3],
  'CD': [0, 5],
  'DC': [5, 0],
  'DD': [1, 1]
};

module.exports = {
    COOPERATE,
    DEFECT,
    COOPERATEML,
    DEFECTML,
    DEBUG,
    POINTS_SYSTEM,
    RUNMEMMNGCODE
  };

  