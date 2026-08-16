const cheerio = require("cheerio");

function clean(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function numberOrNull(value) {
  if (!value) return null;

  const number = Number(
    value
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isNaN(number) ? null : number;
}

function parseBill(html) {
  const $ = cheerio.load(html);

  function getValueByLabel(label) {
    const labelElement = $(".en-lbl")
      .filter(
        (_, el) =>
          clean($(el).text()).toUpperCase() === label
      )
      .first();

    if (!labelElement.length) return null;

    return clean(
      labelElement
        .closest("div.label-row")
        .next(".val-space")
        .text()
    );
  }

  function getMeterValue(label) {
    const labelElement = $(".meter-info-cell .en-lbl")
      .filter(
        (_, el) =>
          clean($(el).text()).toUpperCase() === label
      )
      .first();

    if (!labelElement.length) return null;

    return clean(
      labelElement
        .closest(".meter-info-cell")
        .find(".val-space")
        .first()
        .text()
    );
  }

  function getChargeValue(label) {
    const labelElement = $(".charges-bd-en")
      .filter(
        (_, el) =>
          clean($(el).text()).toUpperCase() === label
      )
      .first();

    if (!labelElement.length) return null;

    return clean(
      labelElement
        .closest(".charges-bd-row")
        .find(".charges-bd-val")
        .first()
        .text()
    );
  }

  function getRightPanelValue(label) {
    const target = label.trim().toUpperCase();

    // BILL MONTH
    if (target === "BILL MONTH") {
      const section = $(".right-section-cell")
        .filter((_, el) => {
          const text = clean(
            $(el)
              .find(".right-panel-en")
              .first()
              .text()
          ).toUpperCase();

          return text === target;
        })
        .first();

      if (!section.length) return null;

      return clean(
        section
          .find(".right-main-val")
          .first()
          .text()
      );
    }

    // DUE DATE
    if (target === "DUE DATE") {
      const direct = $(".right-main-val--due").first();

      if (direct.length) {
        const value = clean(direct.text());

        if (value) {
          return value;
        }
      }

      const section = $(".right-section-cell")
        .filter((_, el) => {
          const text = clean(
            $(el)
              .find(".right-panel-en")
              .first()
              .text()
          )
            .replace(/^âš \s*/, "")
            .toUpperCase();

          return text === target;
        })
        .first();

      if (section.length) {
        const value = clean(
          section
            .find(".right-main-val")
            .first()
            .text()
        );

        if (value) {
          return value;
        }
      }

      return null;
    }

    // READING DATE / ISSUE DATE
    const labelElement = $(".right-panel-en")
      .filter((_, el) => {
        return (
          clean($(el).text())
            .replace(/^âš \s*/, "")
            .toUpperCase() === target
        );
      })
      .first();

    if (!labelElement.length) {
      return null;
    }

    const section = labelElement.closest(
      ".right-section-cell, .right-grid-cell"
    );

    return clean(
      section
        .find(
          ".right-main-val, .right-panel-date-val"
        )
        .first()
        .text()
    );
  }

  // ==================================================
  // LATE PAYMENT / LP SURCHARGE
  // ==================================================

  function getLatePaymentValues() {
    const result = {
      lp_surcharge: null,
      payable_after_due_date: null,
      lp_surcharge_period: null,
      second_lp_surcharge: null,
      payable_after_lp_date: null,
      payable_after_lp_period: null,
    };

    const columns = $(".lp-surcharge-data-col");

    if (!columns.length) {
      return result;
    }

    // FIRST COLUMN
    const firstColumn = columns.eq(0);

    result.lp_surcharge = numberOrNull(
      firstColumn
        .find(".lp-surcharge-top-val")
        .first()
        .text()
    );

    result.lp_surcharge_period =
      clean(
        firstColumn
          .find(".lp-surcharge-period")
          .first()
          .text()
      ) || null;

    result.payable_after_due_date =
      numberOrNull(
        firstColumn
          .find(".lp-surcharge-bottom-val")
          .first()
          .text()
      );

    // SECOND COLUMN
    const secondColumn = columns.eq(1);

    if (secondColumn.length) {
      result.second_lp_surcharge =
        numberOrNull(
          secondColumn
            .find(".lp-surcharge-top-val")
            .first()
            .text()
        );

      result.payable_after_lp_period =
        clean(
          secondColumn
            .find(".lp-surcharge-period")
            .first()
            .text()
        ) || null;

      result.payable_after_lp_date =
        numberOrNull(
          secondColumn
            .find(".lp-surcharge-bottom-val")
            .first()
            .text()
        );
    }

    return result;
  }

  const latePayment = getLatePaymentValues();

  // ==================================================
  // BILL
  // ==================================================

  const bill = {
    reference_number:
      getValueByLabel("REFERENCE NO"),

    consumer_id:
      getValueByLabel("CONSUMER ID"),

    name_address:
      getValueByLabel("NAME & ADDRESS"),

    transformer:
      getValueByLabel("TRANSFORMER"),

    feeder:
      getValueByLabel("FEEDER"),

    sub_division:
      getValueByLabel("SUB DIVISION"),

    category:
      getValueByLabel("CATEGORY"),

    tariff_category:
      getValueByLabel("TARIFF CATEGORY"),

    tariff:
      getValueByLabel("TARIFF"),

    meter_number:
      getMeterValue("METER NO"),

    meter_factor:
      numberOrNull(
        getMeterValue("MF")
      ),

    previous_reading:
      numberOrNull(
        getMeterValue("PREVIOUS READING")
      ),

    present_reading:
      numberOrNull(
        getMeterValue("PRESENT READING")
      ),

    units_consumed:
      numberOrNull(
        getMeterValue("UNITS")
      ),

    bill_month:
      getRightPanelValue("BILL MONTH"),

    reading_date:
      getRightPanelValue("READING DATE"),

    issue_date:
      getRightPanelValue("ISSUE DATE"),

    due_date:
      getRightPanelValue("DUE DATE"),

    subsidies:
      numberOrNull(
        getChargeValue("SUBSIDIES")
      ),

    net_electricity_charges:
      numberOrNull(
        getChargeValue(
          "NET ELECTRICITY CHARGES"
        )
      ),

    taxes:
      numberOrNull(
        getChargeValue("TAXES")
      ),

    current_bill:
      numberOrNull(
        getChargeValue("CURRENT BILL")
      ),

    arrears:
      numberOrNull(
        getChargeValue("ARREARS")
      ),

    installment:
      numberOrNull(
        getChargeValue("INSTALLMENT")
      ),

    adjustments:
      numberOrNull(
        getChargeValue("ADJUSTMENTS")
      ),

    grand_total:
      numberOrNull(
        getChargeValue("GRAND TOTAL")
      ),

    lp_surcharge:
      latePayment.lp_surcharge,

    payable_after_due_date:
      latePayment.payable_after_due_date,

    lp_surcharge_period:
      latePayment.lp_surcharge_period,

    second_lp_surcharge:
      latePayment.second_lp_surcharge,

    payable_after_lp_date:
      latePayment.payable_after_lp_date,

    payable_after_lp_period:
      latePayment.payable_after_lp_period,
  };

  return bill;
}

module.exports = {
  parseBill,
};