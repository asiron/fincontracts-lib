export class Fincontract {
  constructor(id, issuer, owner, proposedOwner, rootDescription) {
    this.id = id;
    this.owner = owner;
    this.issuer = issuer;
    this.proposedOwner = proposedOwner;
    this.rootDescription = rootDescription;
  }
}

export class FincNode {
  constructor(children) {
    this.children = children;
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

export class FincScaleObsNode extends FincNode {
  constructor(child, gatewayAddress) {
    super(child);
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

export class FincGiveNode extends FincNode {}

export class FincZeroNode extends FincNode {}
