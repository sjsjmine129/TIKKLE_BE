const { ExpectedError } = require("./ExpectedError.js");

class OptionCombination {
  constructor({ id, product_id, sales_volume, quantity, db }) {
    this.id = id || null;
    this.product_id = product_id || null;
    this.sales_volume = sales_volume || null;
    this.quantity = quantity || null;
    //TODO: 이것을 사용하는 것으로 모든 옵션 변경
    this.option_combination_detail = {};
    this.db = db || null;
  }

  async uploadOptionCombination() {
    try {
      //TODO: 트렌드메카 재고 업데이트 구현

      const result = await this.db.executeQuery(`INSERT INTO option_combination (product_id, quantity) values (?, ?)`, [this.product_id, this.quantity]);
      for (const category of Object.keys(this.option_combination_detail)) {
        const option_id = this.option_combination_detail[category].id;
        const query = `INSERT INTO option_combination_detail (combination_id, option_id) VALUES (?, ?)`;
        await this.db.executeQuery(query, [result.insertId, option_id]);
      }
      this.id = result.insertId;
      return;

      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ uploadOptionCombination : 🐞${error}`);
      throw error;
    }
  }

  static createOptionCombination(product_id, db) {
    try {
      return new OptionCombination({ product_id, db });
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createOptionCombination : 🐞${error}`);
      throw error;
    }
  }

  /**
   * productid에 대한 새로운 option combination을 생성
   * @param {number} quantity 100000
   * @returns void
   */
  async insertNewOptionCombination(quantity = 100000) {
    try {
      const result = await this.db.executeQuery(`INSERT INTO option_combination (product_id, quantity) values (?, ?)`, [this.product_id, quantity]);
      this.id = result.insertId;
      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ insertNewOptionCombination : 🐞${error}`);
      throw error;
    }
  }

  /**
   * 재고를 감소시키는 함수
   * @memberof OptionCombination
   * @instance
   * @async
   * @example
   * const option_combination = new OptionCombination({id: 1, db});
   * await option_combination.decreaseQuantity();
   * // => option_combination = {
   * //  id: 1,
   * //  product_id: 1,
   * //  sales_volume: 0,
   * //  quantity: 99,
   * // }
   * @returns {Promise<void>} - A promise that resolves with nothing.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @throws {ExpectedError} Throws an ExpectedError with status 400 if the option combination is not valid.
   */

  async decreaseQuantity() {
    try {
      if (this.quantity) {
        this.quantity -= 1;
      }
      const result = this.db.executeQuery(`UPDATE option_combination SET quantity = quantity - 1 WHERE id = ?`, [this.id]);
      if (result.affectedRows === 0) {
        throw error;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ decreaseQuantity : 🐞${error}`);
      throw error;
    }
  }
  /**
   * 재고를 증가시키는 함수
   * @memberof OptionCombination
   * @instance
   * @async
   * @example
   * const option_combination = new OptionCombination({id: 1, db});
   * await option_combination.increaseQuantity();
   * // => option_combination = {
   * //  id: 1,
   * //  product_id: 1,
   * //  sales_volume: 0,
   * //  quantity: 101,
   * // }
   * @returns {Promise<void>} - A promise that resolves with nothing.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @throws {ExpectedError} Throws an ExpectedError with status 400 if the option combination is not valid.
   */
  async increaseQuantity() {
    try {
      if (this.quantity) {
        this.quantity += 1;
      }
      const result = this.db.executeQuery(`UPDATE option_combination SET quantity = quantity + 1 WHERE id = ?`, [this.id]);
      if (result.affectedRows === 0) {
        throw error;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ decreaseQuantity : 🐞${error}`);
      throw error;
    }
  }
}

class ProductOption {
  constructor({ id, product_id, category, option, additional_amount, is_deleted, db }) {
    this.id = id || null;
    this.product_id = product_id || null;
    this.category = category;
    this.option = option;
    this.additional_amount = additional_amount;
    this.is_deleted = is_deleted || 0;
    this.db = db;
  }

  async uploadProductOption() {
    try {
      const result = await this.db.executeQuery(`INSERT INTO product_option (product_id, category, \`option\`, additional_amount) values (?, ?, ?, ?)`, [
        this.product_id,
        this.category,
        this.option,
        this.additional_amount,
      ]);
      this.id = result.insertId;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ uploadProductOption : 🐞${error}`);
      throw error;
    }
  }

  /**
   * 해당 옵션이 이미 업로드 되었는지 확인
   * @returns bool
   */
  checkIsUploaded() {
    try {
      if (this.id == null) {
        return false;
      }
      if (this.id != null) {
        return true;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ checkIsUploaded : 🐞${error}`);
      throw error;
    }
  }
}
class ProductOptions {
  constructor({ product_id, db }) {
    this.product_id = product_id;
    this.formatted_option = null;
    this.formatted_option_combination = null;
    this.product_option_list = null;
    this.option_combination_list = null;
    this.db = db;
  }

  //옵션 객체를 받아서 옵션을 업데이터
  // 현재 가지고 있는 옵션 객체로 db없데이트
  // 특정 product_id에 대해 옵션을 가져오기
  // option_list를 받아서 옵션 형태로 수정
  // 현재 가지고 있는 옵션 객체로 db추가

  /**
   * 상품의 모든 옵션을 가져와 list로 반환
   * @returns
   */
  async loadProductOptions() {
    try {
      const rows = await this.db.executeQuery(`SELECT * FROM product_option WHERE product_id = ?;`, [this.product_id]);
      return rows;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ ProductOptions.loadProductOptions : 🐞${error}`);
      throw error;
    }
  }
  //TODO: 이름 길이 줄이기, product빼기
  updateProductOptionList(product_option_list) {
    try {
      this.product_option_list = product_option_list;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateProductOptionList : 🐞${error}`);
      throw error;
    }
  }

  async uploadProductOptionCombinations() {
    try {
      if (this.formatted_option_combination == null) {
        throw new ExpectedError({
          status: 500,
          message: "ProductOptions.formatCombinationList()를 먼저 실행해야합니다.",
          detail_code: "00",
        });
      }
      for (const option_combination of this.formatted_option_combination) {
        await option_combination.uploadOptionCombination();
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ uploadProductOptionCombinations : 🐞${error}`);
      throw error;
    }
  }

  updateOptionCombinationList(option_combination_list) {
    try {
      this.option_combination_list = option_combination_list;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateProductOptionCombinationList : 🐞${error}`);
      throw error;
    }
  }
  /**
   * 이미 서버상에 존재하는 옵션인지 확인
   * @returns bool
   */
  async checkIsUploaded() {
    try {
      for (const options of Object.values(this.formatted_option)) {
        // 배열 내 어떤 객체라도 id가 null이 아니면 false 반환
        if (options.some((option) => option.checkIsUploaded())) {
          return true;
        }
      }
      // 모든 객체의 id가 null인 경우
      return false;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ checkIsUploaded : 🐞${error}`);
      throw error;
    }
  }
  /**
   * 해당 상품 옵션의 옵션 조합 수를 계산
   * @returns number
   */
  async getNumOfCombination() {
    try {
      const num_of_combination = 1;
      if (this.formatted_option == null) {
        throw new ExpectedError({
          status: 500,
          message: "ProductOptions.formatOptionlist()를 먼저 실행해야합니다.",
          detail_code: "00",
        });
      }
      for (category of Object.keys(this.formatted_option)) {
        num_of_combination *= this.getFormattedOption().category.length;
      }
      return num_of_combination;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ getNumOfCombination : 🐞${error}`);
      throw error;
    }
  }
  /**
   * productOption을 db상에 업로드
   * 1. 각 옵션을 업로드
   * 2. 각 옵션 갯수에 맞는 option combination생성
   * 3. 각 option combination에 맞는 option combination detail생성
   */
  async uploadProductOptions() {
    try {
      if (this.formatted_option == null) {
        throw new ExpectedError({
          status: 500,
          message: "ProductOptions.formatOptionlist()를 먼저 실행해야합니다.",
          detail_code: "00",
        });
      }
      //각 옵션 항목을 업로드
      for (const category of Object.keys(this.formatted_option)) {
        for (const option of this.formatted_option[category]) {
          await option.uploadProductOption();
        }
      }
      //옵션 갯수에 맞는 option combination생성
    } catch (error) {
      console.error(`🚨 error -> ⚡️ uploadProductOptions : 🐞${error}`);
      throw error;
    }
  }

  /**
   * ProductOptions.formatedOption값을 불러옴
   * @returns List <ProductOption>
   */
  async getFormattedOption() {
    try {
      if (this.formatted_option == null) {
        throw new ExpectedError({
          status: "500",
          message: `product.loadProductOptions()를 먼저 실행해야합니다.`,
          detail_code: "00",
        });
      }

      return this.formatted_option;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ getFormattedOption : 🐞${error}`);
      throw error;
    }
  }
  //FIXME: 복잡성 높음 좀 더 쉬운 코드로 수정 요함
  formatCombinationList() {
    try {
      if (this.option_combination_list == null) {
        throw new ExpectedError({
          stauts: "500",
          message: "option_combination_list가 먼저 채워져있어야합니다.",
          detail_code: "00",
        });
      }
      if (this.formatted_option == null) {
        throw new ExpectedError({
          status: "500",
          message: "formatted_option이 먼저 채워져있어야합니다. ProductOptions.formatOptionList를 먼저 실행하세요.",
          detail_code: "00",
        });
      }

      let formatted_option_combination = [];
      // option_combination_list = [
      //   { color: { category: color, option: red }, size: { category: size, option: L } },
      //   { color: { category: color, option: red }, size: { category: size, option: L } },
      //   { color: { category: color, option: red }, size: { category: size, option: L } },
      // ];
      //option_combination = {color: {category: color, option:red}, size: {category: size, option: L}, quantity: 10}
      for (const option_combination of this.option_combination_list) {
        const new_option_combination = new OptionCombination({ product_id: this.product_id, db: this.db });
        new_option_combination.quantity = option_combination.quantity || 100000;
        let combination_option_obj = {};
        //option_category = color

        //option_combination을 좀 더 체계화
        for (const option_category of Object.keys(option_combination)) {
          if (option_category === "quantity") {
            continue;
          }
          const selected_option_list = this.formatted_option[option_category].filter((option_obj) => {
            return option_combination[option_category]["option"] == option_obj["option"];
          });

          if (selected_option_list.length !== 1) {
            throw new ExpectedError({
              status: "500",
              message: "formatted_option이 이상하게 형성되어있습니다.",
              detail_code: "00",
            });
          }

          combination_option_obj[option_category] = selected_option_list[0];
        }
        new_option_combination.option_combination_detail = combination_option_obj;
        formatted_option_combination.push(new_option_combination);
      }
      this.formatted_option_combination = formatted_option_combination;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ formatCombinationList : 🐞${error}`);
      throw error;
    }
  }

  async formatOptionList() {
    try {
      if (this.product_option_list == null) {
        throw new ExpectedError({
          status: "500",
          message: `product_option_list가 먼저 채워져있어야합니다.`,
          detail_code: "00",
        });
      }
      const option_category_dict = {};

      this.product_option_list.forEach((option) => {
        // 옵션에서 카테고리 추출
        const category = option.category;
        // 해당 카테고리가 사전에 아직 존재하지 않으면 초기화
        if (!option_category_dict[category]) {
          option_category_dict[category] = [];
        }
        // 해당 카테고리 리스트에 옵션 추가
        option_category_dict[category].push(new ProductOption({ product_id: this.product_id, ...option, db: this.db }));
      });
      this.formatted_option = option_category_dict;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ formatOptionList : 🐞${error}`);
      throw error;
    }
  }
}

class Brand {
  constructor({ id, brand_name, is_deleted, db }) {
    this.id = id || null;
    this.brand_name = brand_name || null;
    this.is_deleted = is_deleted || null;
    this.db = db || null;
  }
  toJSON() {
    return {
      id: this.id,
      brand_name: this.brand_name,
      is_deleted: this.is_deleted,
      // 다른 프로퍼티들도 포함시킵니다.
    };
  }

  static async checkBrandNameList(brand_name_list, db) {
    try {
      //brand_name_list에서 중복을 제거
      brand_name_list = [...new Set(brand_name_list)];
      //기존에 존재하는 브랜드인지 확인
      const placeholders = brand_name_list.map(() => "?").join(", ");
      // 쿼리를 실행할 때 placeholders를 사용하고 배열의 요소들을 전달합니다.
      const result = await db.executeQuery(`SELECT * FROM brands WHERE brand_name IN (${placeholders})`, [...brand_name_list]);
      //존재하지 않는브랜드는 새로 생성
      let brand_obj_list = [];

      for (const brand_name of brand_name_list) {
        const brandExists = result.some((brand) => brand.brand_name === brand_name);
        if (!brandExists) {
          const temp_result = await db.executeQuery(`INSERT INTO brands (brand_name) VALUES (?)`, [brand_name]);
          const newBrand = new Brand({ id: temp_result.insertId, brand_name: brand_name, db });
          const newBrandObj = newBrand.toJSON();
          brand_obj_list.push(newBrandObj);
        } else {
          const brand = result.find((brand) => brand.brand_name === brand_name);
          const existingBrand = new Brand({ id: brand.id, brand_name: brand_name, db });
          const existingBrandObj = existingBrand.toJSON();
          brand_obj_list.push(existingBrandObj);
        }
      }

      return brand_obj_list;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ checkBrandNameList : 🐞${error}`);
      throw error;
    }
  }
}

class Product {
  constructor({ id, name, price, description = null, category_id, thumbnail_image, brand_id, created_at, views, is_deleted, wishlist_count, images, db }) {
    this.id = id || null;
    this.name = name || null;
    this.price = price || null;
    this.description = description || "";
    this.category_id = category_id || null;
    this.brand_id = brand_id || null;
    this.created_at = created_at || null;
    this.views = views || null;
    this.is_deleted = is_deleted || null;
    this.wishlist_count = wishlist_count || null;
    this.thumbnail_image = thumbnail_image || null;
    this.images = images || null;
    this.product_options = id == null ? null : new ProductOptions({ product_id: id, db: db });
    this.selected_options = null;
    this.selected_option_combination = null;
    this.db = db;
  }

  static async checkIsUploaded(product_name, db) {
    try {
      const result = await db.executeQuery(`SELECT * FROM products WHERE name = ?`, [product_name]);
      if (result.length === 0) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ checkIsUploaded : 🐞${error}`);
      throw error;
    }
  }

  static async createUnregisteredProduct(product, db) {
    try {
      if (product.product_option_list == null || product.option_combination_list == null) {
        throw new ExpectedError({
          status: 500,
          message: "새로운 상품 등록일 경우 product.product_option_list, product.option_combination_list가 있어야합니다.",
          detail_code: "00",
        });
      }
      //product 등록
      const newProduct = new Product({ ...product, db });
      await newProduct.enrollProduct();
      newProduct.product_options = new ProductOptions({ product_id: newProduct.id, db: newProduct.db });
      newProduct.product_options.updateOptionCombinationList(product.option_combination_list);
      newProduct.product_options.updateProductOptionList(product.product_option_list);
      return newProduct;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createUnregisteredProduct : 🐞${error}`);
      throw error;
    }
  }

  /**
   * 상품이 갖고있는 모든 옵션을 로드하고 해당 옵션을 product_options에 저장한다.
   * @memberof Product
   */
  async loadProductOptions() {
    try {
      const product_option_list = await this.product_options.loadProductOptions();
      this.product_options.updateProductOptionList(product_option_list);

      await this.product_options.formatOptionList();

      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ loadProductOptions : 🐞${error}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  }

  async uploadProduct() {
    try {
      const result = await this.db.executeQuery(
        `INSERT INTO products (name, price, description, category_id, brand_id, views, is_deleted, thumbnail_image, images) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      this.id = result.insertId;
      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ uploadProduct : 🐞${error}`);
      throw error;
    }
  }
  //selected option이 실제 존재하는 option인지 검증하는 함수
  async validateProductOption(selectedOption) {
    try {
      for (const [category, option] of Object.entries(selectedOption)) {
        // 선택된 옵션의 카테고리와 일치하는 제품 옵션을 찾는다.

        const formatted_option = await this.product_options.getFormattedOption();
        // 일치하는 카테고리가 없으면, 선택된 옵션은 유효하지 않다.
        if (category in Object.keys(formatted_option)) {
          throw new ExpectedError({
            status: "400",
            message: `해당 옵션은 존재하지 않습니다.`,
            detail_code: "01",
          });
        }
        // 일치하는 카테고리가 있다면, 선택된 옵션이 유효한지 확인한다.
        if (!formatted_option[category].some((productOption) => productOption.option === option)) {
          throw new ExpectedError({
            status: "400",
            message: `해당 옵션은 존재하지 않습니다.`,
            detail_code: "01",
          });
        }
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateProductOption : 🐞${error}`);
      throw error;
    }
  }

  // 선택한 option_combination의 재고가 남아있는지 확인하는 함수
  /**
   * 선택한 옵션 조합의 재고가 남아있는지 확인하는 함수
   * @memberof Product
   * @instance
   * @async
   * @example
   * const product = await Product.createById(1);
   * await product.loadSelectedProductOptionCombination();
   * product.validateProductOptionCombination();
   * // => product.selected_option_combination = {
   * //  id: 1,
   * //  sales_volume: 0,
   * //  quantity: 100,

   * // }
   * @returns {Promise<void>} - A promise that resolves with nothing.
   * @throws {ExpectedError} Throws an ExpectedError with status 400 if the selected option combination is not valid.
   */
  validateProductOptionCombination() {
    if (this.selected_option_combination.quantity === 0) {
      throw new ExpectedError({
        status: "400",
        message: `해당 옵션 조합의 재고가 없습니다.`,
        detail_code: "02",
      });
    }
  }

  //TODO: 서브쿼리 사용하여 최적화 요함
  async loadSelectedProductOptionCombination() {
    try {
      const selected_option_values = Object.values(this.selected_options);
      const count = selected_option_values.length;
      const formattedValues = selected_option_values.map((val) => `'${val}'`).join(", ");
      const findCombinationQuery = `
          SELECT oc.*
          FROM option_combination AS oc
          INNER JOIN option_combination_detail AS ocd ON oc.id = ocd.combination_id
          INNER JOIN product_option AS po ON po.id = ocd.option_id
          WHERE po.option IN (${formattedValues}) AND oc.product_id = ?
          GROUP BY oc.id
          HAVING COUNT(*) = ?;
        `;

      const result = await this.db.executeQuery(findCombinationQuery, [this.id, count]);
      if (result.length === 0) {
        throw new ExpectedError({
          status: "400",
          message: `해당 옵션 조합이 존재하지 않습니다.`,
          detail_code: "01",
        });
      }

      const option_combination = new OptionCombination({ ...result[0], db: this.db });
      this.selected_option_combination = option_combination;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ loadSelectedProductOptionCombination : 🐞${error}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  }

  //product의 가격을 계산하고 해당 가격을 input값과 비교
  /**
   * 상품의 가격을 계산하고 해당 가격을 input값과 비교하는 함수
   * @memberof Product
   * @instance
   * @async
   * @example
   * const product = await Product.createById(1);
   * await product.loadSelectedProductOptionCombination();
   * product.validateProductOptionCombination();
   * product.validateProductPrice(10000);
   * // => product.selected_option_combination = {
   * //  id: 1,
   * //  product_id: 1,
   * //  sales_volume: 0,
   * //  quantity: 100,
   * // }
   * @returns {Promise<void>} - A promise that resolves with nothing.
   * @throws {ExpectedError} Throws an ExpectedError with status 400 if the product price is not valid.
   * @param {number} input_price - The price of the product to validate.
   */
  async validateProductPrice(input_price) {
    try {
      const totalPrice = await this.calculateTotalPrice();
      if (totalPrice !== input_price) {
        throw new ExpectedError({
          status: "400",
          message: `상품의 가격이 일치하지 않습니다.`,
          detail_code: "03",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateProductPrice : 🐞${error}`);
      if (error.status) {
        throw error;
      }
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  }

  async lockProduct() {
    try {
      this.db.executeQuery(`SELECT * FROM products WHERE id = ? FOR UPDATE;`, [this.id]);
    } catch (err) {
      console.error(`🚨 error -> ⚡️ lockProductForStartTIkkling : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  }

  async updateSelectedOption(product_option) {
    this.selected_options = product_option;
  }

  //product_option의 addition_amount와 selectedoption을 고려하여 product의 전체 가격을 계산하는 함수
  async calculateTotalPrice() {
    try {
      let additionalAmount = 0;
      const formatted_option = await this.product_options.getFormattedOption();
      for (const category of Object.keys(formatted_option)) {
        additionalAmount += await formatted_option[category].find((option) => {
          return option.option == this.selected_options[category];
        }).additional_amount;
      }
      return this.price + additionalAmount;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ calculateTotalPrice : 🐞${error}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  }

  /**
   * id를 사용하여 Product 인스턴스를 생성한다.
   * @memberof Product
   * @static
   * @async
   * @example
   * const db = new DBManager();
   * await db.openTransaction();
   * const product = await Product.createById(1, db);
   * // => product = {
   * //  id: 1,
   * //  name: "티클링 상품",
   * //  price: 10000,
   * //  description: "티클링 상품입니다.",
   * //  category_id: 1,
   * //  brand_id: 1,
   * //  created_at: "2020-01-01 00:00:00",
   * //  views: 0,
   * //  is_deleted: 0,
   * //  wishlist_count: 0,
   * //  thumbnail_image: "https://tikkle-image.s3.ap-northeast-2.amazonaws.com/1.jpg",
   * //  images: [
   * //    "https://tikkle-image.s3.ap-northeast-2.amazonaws.com/1.jpg",
   * //    "https://tikkle-image.s3.ap-northeast-2.amazonaws.com/2.jpg",
   * //    "https://tikkle-image.s3.ap-northeast-2.amazonaws.com/3.jpg",
   * //  ],
   * //  product_options: [],
   * //  selected_options: null,
   * //  selected_option_combination: null,
   * // }
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @param {number} id - The id of the product to create.
   * @returns {Promise<Product>} - A promise that resolves with a Product instance.
   */
  static createById = async ({ id, db }) => {
    try {
      const query = `SELECT * FROM products WHERE id = ?`;
      const rows = await db.executeQuery(query, [id]);
      return new Product({ ...rows[0], db });
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createById : 🐞${error}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  };

  async decreaseProductQuantity() {
    try {
      this.selected_option_combination.decreaseQuantity();
    } catch (error) {
      console.error(`🚨 error -> ⚡️ decreaseProductQuantity : 🐞${error}`);
      throw error;
    }
  }
  async increaseProductSalesVolume() {
    try {
      if (this.sales_volume) {
        this.sales_volume += 1;
      }
      const result = this.db.executeQuery(`UPDATE products SET sales_volume = sales_volume + 1 WHERE id = ?`, [this.id]);
      if (result.affectedRows === 0) {
        throw ExpectedError({
          status: 500,
          detail_code: "00",
          message: "상품 판매량 증가 실패",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ increaseQuantity : 🐞${error}`);
      throw error;
    }
  }

  static async createProductList(product_list, db) {
    try {
      const product_obj_list = [];
      for (const product of product_list) {
        product_obj_list.push(new Product(product, db));
      }
      return product_obj_list;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createProductList : 🐞${error}`);
      throw error;
    }
  }
  /**
   * 개별 상품 등록
   */
  async enrollProduct() {
    try {
      const rows = await this.db.executeQuery(`SELECT * FROM products WHERE name = ?`, [this.name]);
      if (rows.length == 0) {
        const result_of_insert_product = await this.db.executeQuery(`INSERT INTO products (name, price, description, category_id, brand_id, thumbnail_image, images) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
          this.name,
          this.price,
          this.description,
          this.category_id,
          this.brand_id,
          this.thumbnail_image,
          this.images,
        ]);
        this.id = result_of_insert_product.insertId;
        return result_of_insert_product.insertId;
      }
      if (rows.length == 1) {
        this.id = rows[0].id;
        return rows[0].id;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ enrollProduct : 🐞${error}`);
      throw error;
    }
  }
}

module.exports = { Product, OptionCombination, Brand };
