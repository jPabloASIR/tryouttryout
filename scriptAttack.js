
// scriptAttack.js
// Motor de cálculo de daño para Playground TCG

/**
 * Comprueba si el Pokémon tiene las energías necesarias para usar un ataque
 * @param {Object} pokemon - El Pokémon que ataca (con pokemon.energies: [])
 * @param {Object} attack - El ataque desde el JSON (con attack.cost: [])
 * @returns {boolean}
 */
function checkEnergy(pokemon, attack) {
  if (!attack.cost || attack.cost.length === 0) return true;
  const energyCopy = [...(pokemon.energies || [])];
  for (let type of attack.cost) {
    const index = energyCopy.indexOf(type);
    if (index === -1) {
      return false;
    }
    energyCopy.splice(index, 1);
  }
  return true;
}

/**
 * Aplica resistencias, debilidades y devuelve el daño final
 * @param {Object} attacker - El Pokémon que ataca
 * @param {Object} attack - El ataque usado
 * @param {Object} defender - El Pokémon que defiende
 * @returns {number} daño calculado
 */
function calculateDamage(attacker, attack, defender) {
  let baseDamage = parseInt(attack.damage) || 0;

  // Efectos básicos de + o x
  if (attack.damage.includes("+")) {
    // Ejemplo simple: +10 por cada energía extra del mismo tipo
    const costType = attack.cost[0];
    const extraEnergies = (attacker.energies || []).filter(e => e === costType).length - 1;
    baseDamage += extraEnergies * 10;
  }
  if (attack.damage.includes("x")) {
    // Ejemplo simple: multiplica por 2 (ajustar según efecto real)
    baseDamage *= 2;
  }

  // Weakness
  if (defender.weakness && defender.weakness.type === attacker.type) {
    baseDamage *= 2;
  }

  // Resistance
  if (defender.resistance && defender.resistance.type === attacker.type) {
    baseDamage -= defender.resistance.value || 30;
    if (baseDamage < 0) baseDamage = 0;
  }

  return baseDamage;
}

/**
 * Aplica efectos especiales descritos en attack.effect
 * @param {Object} attack
 * @returns {Object} con {cancel: true} si el ataque falla
 */
function applyEffect(attack) {
  if (!attack.effect) return {};

  if (attack.effect.includes("Flip a coin")) {
    const coin = Math.random() < 0.5 ? "heads" : "tails";
    console.log("Coin flip:", coin);
    if (coin === "tails") {
      return { cancel: true };
    }
  }

  // Aquí se pueden añadir más reglas para efectos específicos

  return {};
}

/**
 * Ejecuta un ataque de un Pokémon contra otro
 * @param {Object} attacker - Pokémon atacante
 * @param {number} attackIndex - Índice del ataque
 * @param {Object} defender - Pokémon defensor
 * @returns {string} mensaje de resultado
 */
function useAttack(attacker, attackIndex, defender) {
  const attack = attacker.attacks[attackIndex];
  if (!checkEnergy(attacker, attack)) {
    return attacker.name + " does not have enough energy to use " + attack.name;
  }

  const effectResult = applyEffect(attack);
  if (effectResult.cancel) {
    return attack.name + " failed!";
  }

  const dmg = calculateDamage(attacker, attack, defender);
  defender.hp -= dmg;
  if (defender.hp < 0) defender.hp = 0;

  let result = attacker.name + " used " + attack.name + " and dealt " + dmg + " damage to " + defender.name;
  if (defender.hp === 0) {
    result += ". " + defender.name + " fainted!";
  }
  return result;
}

// Exportar para uso en el navegador
if (typeof window !== "undefined") {
  window.checkEnergy = checkEnergy;
  window.calculateDamage = calculateDamage;
  window.applyEffect = applyEffect;
  window.useAttack = useAttack;
}
