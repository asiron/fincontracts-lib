
class FincontractFactory {

  static get Primitives(int) {
    [FincOneNode, ONE, GIVE, AND, OR, SCALEOBS, IF];
 
  }



  static PullContract(fctId) {
    fctInfo = FincontractMarketplace.getFincontractInfo(fctId);

  }

  static PullDescription(dscId) {
    description = null;
  }

}