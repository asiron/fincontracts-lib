export const Currencies = {
  0 : 'USD', 
  1 : 'EUR'
}

export class Fincontract {
  constructor(id, issuer, owner, proposedOwner, rootDescription) {
    this.id = id;
    this.issuer = issuer;
    this.owner  = owner;
    this.proposedOwner = proposedOwner;
    this.rootDescription = rootDescription;
  }
}

export class FincNode {
  constructor(children) {
    this.children  = children;
  }

  accept(visitor) {
    return visitor.visit(this);
  }
}

export class FincTimeboundNode extends FincNode {
  constructor(child, lowerBound, upperBound) {
    super(child);
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
  }
}

export class FincAndNode extends FincNode {
  constructor(leftChild, rightChild) {
    super([leftChild, rightChild]);
  }
}

export class FincIfNode extends FincNode {
  constructor(leftChild, rightChild, gatewayAddress) {
    super([leftChild, rightChild]);
    this.gatewayAddress = gatewayAddress;
  }
}

export class FincOrNode extends FincNode {
  constructor(leftChild, rightChild) {
    super([leftChild, rightChild]);
  }
}

export class FincGiveNode extends FincNode {
  constructor(child) {
    super(child);
  }
}

/* move this.range to evaluator ??? */
export class FincScaleObsNode extends FincNode {
  constructor(child, range, gatewayAddress) {
    super(child);
    this.range = range;
    this.gatewayAddress = gatewayAddress;
  }
}

export class FincScaleNode extends FincNode {
  constructor(child, scale) {
    super(child);
    this.scale = scale;
  }
}

export class FincOneNode extends FincNode {
  constructor(currency) {
    super(null);
    this.currency = currency;
  }
}

export class FincZeroNode extends FincNode {
  constructor() {
    super(null);
  }
}
