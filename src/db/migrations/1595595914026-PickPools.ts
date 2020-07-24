import {MigrationInterface, QueryRunner} from "typeorm";

export class PickPools1595595914026 implements MigrationInterface {
    name = 'PickPools1595595914026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "pool_type_enum" AS ENUM('c', 'a')`, undefined);
        await queryRunner.query(`CREATE TABLE "pool" ("name" character varying NOT NULL, "type" "pool_type_enum" NOT NULL DEFAULT 'c', "default" boolean NOT NULL DEFAULT false, "open" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f95d0716f34905d8c2a0f29ee99" PRIMARY KEY ("name"))`, undefined);
        await queryRunner.query(`CREATE TABLE "pick" ("id" SERIAL NOT NULL, "pickedDate" TIMESTAMP, "pickedRemark" character varying, "userUsername" character varying, "poolName" character varying, CONSTRAINT "UQ_51af7b1c3e2994d5fe71cb4efc6" UNIQUE ("userUsername", "poolName"), CONSTRAINT "PK_f498e7313427eea815719241927" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_51af7b1c3e2994d5fe71cb4efc" ON "pick" ("userUsername", "poolName") `, undefined);
        await queryRunner.query(`ALTER TABLE "pick" ADD CONSTRAINT "FK_68ea89acccda777b413d44818e1" FOREIGN KEY ("userUsername") REFERENCES "user"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "pick" ADD CONSTRAINT "FK_fc2639f2e2fc99314a5450988dc" FOREIGN KEY ("poolName") REFERENCES "pool"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pick" DROP CONSTRAINT "FK_fc2639f2e2fc99314a5450988dc"`, undefined);
        await queryRunner.query(`ALTER TABLE "pick" DROP CONSTRAINT "FK_68ea89acccda777b413d44818e1"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_51af7b1c3e2994d5fe71cb4efc"`, undefined);
        await queryRunner.query(`DROP TABLE "pick"`, undefined);
        await queryRunner.query(`DROP TABLE "pool"`, undefined);
        await queryRunner.query(`DROP TYPE "pool_type_enum"`, undefined);
    }

}
