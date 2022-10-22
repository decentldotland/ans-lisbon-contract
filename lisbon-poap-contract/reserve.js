export async function handle(state, action) {
  const input = action.input;

  const requests = state.requests;
  const allowedCharCodes = state.allowedCharCodes;
  const reserved = state.reserved;
  const limit = state.limit;

  const ERROR_INVALID_DATA_TYPE = `THE_PASSED_ARGUMENT_MUST_BE_A_STRING`;
  const ERROR_INVALID_EVM_ADDRESS_SYNTAX = `INVALID_EVM_ADDRESS_SYNTAX`;
  const ERROR_USER_ALREADY_RESERVED = `EVM_ADDR_ALREADT_RESRVED_A_DOMAIN`;
  const ERROR_INVALID_CHARCODE = `ANS_LABEL_HAS_UNSUPPORTED_CHAR_CODE`;
  const ERROR_INVALID_STRING_LENGTH = `INVALID_ANS_LABEL_LENGTH`;
  const ERROR_ANS_ALREADY_RESERVED = `THIS_ANS_DOMAIN_HAS_BEEN_ALREADY_RESERVED`;
  const ERROR_REACHED_RES_LIMIT = `THE_CONTRACT_REACHED_MAX_NB_OF_RESERVATIONS`;

  if (input.function === "reserve") {
    const ans = input.ans;
    const evm_address = input.evm_address;

    _validateAnsSyntax(ans);
    _reservedAnsDomains(ans);
    _validateEvmAddress(evm_address);
    _multiEntry(evm_address);

    _checkReservationsLimit();

    requests.push({
      evm_address: evm_address,
      reserved_ans: ans,
      block_timestamp: SmartWeave.block.timestamp,
    });

    return { state };
  }

  function _reservedAnsDomains(domain) {
    const reservedDomains = requests.map((request) => request.reserved_ans);

    if (reservedDomains.includes(domain)) {
      throw new ContractError(ERROR_ANS_ALREADY_RESERVED);
    }
  }

  function _validateEvmAddress(address) {
    ContractAssert(typeof address === "string", ERROR_INVALID_DATA_TYPE);
    ContractAssert(
      /^0x[a-fA-F0-9]{40}$/.test(address),
      ERROR_INVALID_EVM_ADDRESS_SYNTAX
    );
  }

  function _multiEntry(evm_address) {
    const isMulti = requests.find((user) => user.evm_address === evm_address);
    ContractAssert(!isMulti, ERROR_USER_ALREADY_RESERVED);
  }

  function _validateAnsSyntax(username) {
    ContractAssert(typeof username === "string", ERROR_INVALID_DATA_TYPE);

    const caseFolded = username.toLowerCase();
    const normalizedUsername = caseFolded.normalize("NFKC");

    const stringCharcodes = normalizedUsername
      .split("")
      .map((char) => char.charCodeAt(0));

    for (let charCode of stringCharcodes) {
      if (!allowedCharCodes.includes(charCode)) {
        throw new ContractError(ERROR_INVALID_CHARCODE);
      }
    }

    if (normalizedUsername.length < 2 || normalizedUsername.length > 15) {
      throw new ContractError(ERROR_INVALID_STRING_LENGTH);
    }
  }

  function _checkReservationsLimit() {
    ContractAssert(reserved < limit, ERROR_REACHED_RES_LIMIT);
    state.reserved += 1;
  }
}
