<?php
/*
 * IMANI SUPERDEALER - configuration SAMPLE.
 * Copy this file to config.local.php (same folder) and fill in your cPanel
 * MySQL details. config.local.php is blocked from direct download by .htaccess
 * and is ignored by git.
 */
return array(
  'db_host' => 'localhost',
  'db_port' => 3306,
  'db_name' => 'youruser_imani',      // cPanel database name
  'db_user' => 'youruser_imani',      // cPanel database user
  'db_pass' => 'CHANGE_ME',

  // Initial passwords for the seeded accounts (superadmin / om / md).
  // Change these BEFORE first load, or change the passwords right after login.
  'seed_password' => 'imani123',
);
