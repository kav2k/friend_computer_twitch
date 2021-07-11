import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialPoolSelectSupport1626019141258 implements MigrationInterface {
    name = 'InitialPoolSelectSupport1626019141258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "currentPoolName" character varying, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pick" ADD "picked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "pick" ADD "reservedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pick" ADD "customName" character varying`);
        await queryRunner.query(`ALTER TABLE "settings" ADD CONSTRAINT "FK_d9e6ebad266c0eb71cebf218515" FOREIGN KEY ("currentPoolName") REFERENCES "pool"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP CONSTRAINT "FK_d9e6ebad266c0eb71cebf218515"`);
        await queryRunner.query(`ALTER TABLE "pick" DROP COLUMN "customName"`);
        await queryRunner.query(`ALTER TABLE "pick" DROP COLUMN "reservedDate"`);
        await queryRunner.query(`ALTER TABLE "pick" DROP COLUMN "picked"`);
        await queryRunner.query(`DROP TABLE "settings"`);
    }

}
