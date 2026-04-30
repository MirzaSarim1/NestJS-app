import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: 'user' })
  role!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  otp!: string | null;

  @Column({ type: 'datetime', nullable: true })
  otpExpiresAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetOtp!: string | null;

  @Column({ type: 'datetime', nullable: true })
  passwordResetOtpExpiresAt!: Date | null;
}
